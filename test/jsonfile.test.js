'use strict'

const Fs = require('fs')
const Path = require('path')

const Seneca = require('seneca')
const Shared = require('@seneca/store-test')
const Code = require('@hapi/code')
const Lab = require('@hapi/lab')

const lab = (exports.lab = Lab.script())
const { describe, before, after, it } = lab
const { expect } = Code

const folder = Path.join(__dirname, 'db')

function make_seneca(opts, logspec) {
  return Seneca({ legacy: false })
    .test(logspec)
    .use('@seneca/entity')
    .use('..', Object.assign({ folder: folder }, opts))
}

const si = make_seneca()

describe('jsonfile-store', function () {
  before(() => si.ready())
  after(() => si.close())

  Shared.basictest({
    seneca: si,
    script: lab,
  })
})

// Load failures are fatal; debug.undead keeps the process alive so that
// the test can read the error.
async function load_errors(use) {
  const errs = []
  const s0 = Seneca({ legacy: false, debug: { undead: true } }).test(
    (err) => errs.push(err),
    'silent'
  )
  use(s0)
  await new Promise((resolve) => s0.ready(resolve))
  return errs
}

describe('jsonfile-store options', function () {
  it('fails to load without @seneca/entity', async function () {
    const errs = await load_errors((s0) => s0.use('..', { folder: folder }))
    expect(errs.map((err) => err.code)).to.include('plugin_required')
  })

  it('fails when the folder does not exist', async function () {
    const missing = Path.join(folder, 'does-not-exist')
    const errs = await load_errors((s0) =>
      s0.use('@seneca/entity').use('..', { folder: missing })
    )
    expect(errs.length).to.equal(1)
    expect(errs[0].code).to.equal('plugin_init')
    expect(errs[0].message).to.include('folder-not-found')
  })

  it('writes a marker file', async function () {
    const s0 = make_seneca()
    await s0.ready()
    expect(Fs.existsSync(Path.join(folder, 'seneca.txt'))).to.be.true()
    await s0.close()
  })

  it('native$ gives the options', async function () {
    const s0 = make_seneca()
    await s0.ready()
    const native = await s0.entity('foo').native$()
    expect(native.folder).to.equal(folder)
    await s0.close()
  })

  it('merges an update into the stored entity', async function () {
    const s0 = make_seneca()
    await s0.ready()
    const foo0 = await s0.entity('mrg').data$({ a: 1, b: 2 }).save$()
    const foo1 = await s0.entity('mrg').data$({ id: foo0.id, b: 3 }).save$()
    expect(foo1.data$(false)).to.equal({ id: foo0.id, a: 1, b: 3 })
    await s0.close()
  })

  it('replaces the stored entity with merge: false', async function () {
    const s0 = make_seneca({ merge: false })
    await s0.ready()
    const foo0 = await s0.entity('mrg').data$({ a: 1, b: 2 }).save$()
    const foo1 = await s0.entity('mrg').data$({ id: foo0.id, b: 3 }).save$()
    expect(foo1.data$(false)).to.equal({ id: foo0.id, b: 3 })
    const foo2 = await s0.entity('mrg').load$(foo0.id)
    expect(foo2.data$(false)).to.equal({ id: foo0.id, b: 3 })
    await s0.close()
  })

  it('replaces the stored entity with merge$: false', async function () {
    const s0 = make_seneca()
    await s0.ready()
    const foo0 = await s0.entity('mrg').data$({ a: 1, b: 2 }).save$()
    const foo1 = await s0
      .entity('mrg')
      .data$({ id: foo0.id, b: 3, merge$: false })
      .save$()
    expect(foo1.data$(false)).to.equal({ id: foo0.id, b: 3 })
    await s0.close()
  })
})

describe('jsonfile-store concurrency', { timeout: 20000 }, function () {
  before(() => {
    for (const name of ['cnc', 'bad']) {
      Fs.rmSync(Path.join(folder, name), { recursive: true, force: true })
    }
  })

  // Big files widen the window in which a save is part way through.
  function bigdata(more) {
    const data = {}
    for (let i = 0; i < 1000; i++) data['f' + i] = 'v' + i
    return Object.assign(data, more)
  }

  it('merges concurrent saves of the same entity in turn', async function () {
    const s0 = make_seneca()
    await s0.ready()
    const foo0 = await s0.entity('cnc').data$(bigdata()).save$()

    for (let round = 0; round < 5; round++) {
      const saves = []
      for (let i = 0; i < 10; i++) {
        saves.push(
          s0
            .entity('cnc')
            .data$({ id: foo0.id, ['m' + i]: round })
            .save$()
        )
      }
      await Promise.all(saves)
    }

    const foo1 = await s0.entity('cnc').load$(foo0.id)
    expect(foo1.f999).to.equal('v999')
    for (let i = 0; i < 10; i++) expect(foo1['m' + i]).to.equal(4)
    await s0.close()
  })

  it('loads and lists whole files during saves', async function () {
    const s0 = make_seneca({ merge: false })
    await s0.ready()
    const foo0 = await s0.entity('cnc').data$(bigdata()).save$()

    for (let round = 0; round < 5; round++) {
      const acts = []
      for (let i = 0; i < 10; i++) {
        acts.push(
          s0
            .entity('cnc')
            .data$(bigdata({ id: foo0.id, n: i }))
            .save$(),
          s0.entity('cnc').load$(foo0.id),
          s0.entity('cnc').list$()
        )
      }
      for (const out of await Promise.all(acts)) {
        const foo = Array.isArray(out)
          ? out.find((foo) => foo0.id === foo.id)
          : out
        expect(foo.f999).to.equal('v999')
      }
    }
    await s0.close()
  })

  it('reports a file that does not parse as an error', async function () {
    const s0 = make_seneca({}, 'silent')
    await s0.ready()
    const foo0 = await s0.entity('bad').data$({ a: 1 }).save$()
    const filepath = Path.join(folder, 'bad', foo0.id + '.json')
    Fs.writeFileSync(filepath, '{"a":')

    const err0 = await s0
      .entity('bad')
      .load$(foo0.id)
      .catch((err) => err)
    expect(err0.code).to.equal('entity_error')

    const err1 = await s0
      .entity('bad')
      .data$({ id: foo0.id, b: 2 })
      .save$()
      .catch((err) => err)
    expect(err1.code).to.equal('entity_error')

    Fs.unlinkSync(filepath)
    await s0.close()
  })
})
