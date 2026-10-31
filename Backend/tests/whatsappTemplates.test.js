const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('database template validator accepts five WhatsApp templates alongside emails, rejects six', () => {
  class Schema { constructor(fields) { this.fields = fields; } }
  Schema.Types = { ObjectId: String };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../models/Jobs.js'), 'utf8'), {
    module, require: () => ({ Schema, model: (_name, schema) => schema }),
  });
  const { validator } = module.exports.fields.communicationTemplates.validate;
  const emails = Array.from({ length: 5 }, () => ({ channel: 'EMAIL' }));
  assert.equal(validator(emails), true);
  assert.equal(validator([...emails, ...Array.from({ length: 5 }, () => ({ channel: 'WHATSAPP' }))]), true);
  assert.equal(validator(Array.from({ length: 6 }, () => ({ channel: 'WHATSAPP' }))), false);
});

test('requirements create and update with five WhatsApp templates, and reject six', async () => {
  const handlers = {};
  let saved;
  let databaseError;
  class Job {
    constructor(data) { Object.assign(this, data); this._id = 'job'; }
    async save() { saved = this; }
    toObject() { return { ...this }; }
    static findById() { return { populate() { return this; }, then(resolve) { resolve(saved || new Job({})); } }; }
    static async findByIdAndUpdate(_id, update) { if (databaseError) throw databaseError; saved = new Job(update.$set); return saved; }
  }
  const router = { post(url, ...args) { handlers.post = args.at(-1); }, put(url, ...args) { handlers.put = args.at(-1); }, get() {}, delete() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Jobroutes.js'), 'utf8'), {
    module: { exports: {} }, console,
    require(name) {
      if (name === '../services/emailSequences') return require(name);
      if (name === 'express') return { Router: () => router };
      if (name === '../models/Jobs') return Job;
      if (name === '../middleware/jobDescriptionUpload') return { single: () => () => {} };
      if (name === './logactivity') return () => {};
      return {};
    },
  });
  for (const method of ['post', 'put']) {
    for (const count of [1, 5, 6]) {
      const communicationTemplates = Array.from({ length: count }, (_, index) => ({ channel: 'WHATSAPP', label: `Message ${index + 1}`, body: `Hello ${index}` }));
      const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
      await handlers[method]({ body: { communicationTemplates }, params: { id: 'job' }, user: { _id: 'admin', designation: 'Admin' } }, response);
      assert.equal(response.statusCode, count > 5 ? 400 : method === 'post' ? 201 : 200);
      if (count <= 5) assert.equal(response.body.job.communicationTemplates.length, count);
    }
  }
  databaseError = { name: 'ValidationError', errors: { body: { message: 'Template message is required' } } };
  const response = { status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await handlers.put({ body: {}, params: { id: 'job' }, user: { _id: 'admin', designation: 'Admin' } }, response);
  assert.equal(response.code, 400);
  assert.equal(response.body.message, 'Template message is required');
});
