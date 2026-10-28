const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('requirements create and update with five WhatsApp templates, and reject six', async () => {
  const handlers = {};
  let saved;
  class Job {
    constructor(data) { Object.assign(this, data); this._id = 'job'; }
    async save() { saved = this; }
    toObject() { return { ...this }; }
    static findById() { return { populate() { return this; }, then(resolve) { resolve(saved || new Job({})); } }; }
    static async findByIdAndUpdate(_id, update) { saved = new Job(update.$set); return saved; }
  }
  const router = { post(url, ...args) { handlers.post = args.at(-1); }, put(url, ...args) { handlers.put = args.at(-1); }, get() {}, delete() {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../routes/Jobroutes.js'), 'utf8'), {
    module: { exports: {} }, console,
    require(name) {
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
});
