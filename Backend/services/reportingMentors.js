const User = require('../models/Users');

const validateReportingMentors = async (ids, designation, actor) => {
  if (ids === undefined) return;
  const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
  if (!actor || (actor.designation !== 'Admin' && !actor.isAdmin)) fail(403, 'Only admins can assign reporting mentors.');
  if (designation !== 'Manager') fail(400, 'Reporting mentors can be assigned only to a Manager.');
  if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !/^[a-f\d]{24}$/i.test(id)) || new Set(ids).size !== ids.length) fail(400, 'Select valid, unique mentors.');
  if (await User.countDocuments({ _id: { $in: ids }, designation: 'Mentor' }) !== ids.length) fail(400, 'One or more selected mentors no longer exist or have changed roles.');
};

const syncReportingMentors = async (managerId, ids) => {
  if (ids === undefined) return;
  const cast = value => User.schema.path('reporter').cast(value);
  const manager = cast(managerId);
  const selected = ids.map(cast);
  // Keep other managers and primary reporters; remove only this manager when deselected.
  await User.updateMany({ designation: 'Mentor', $or: [{ reporter: manager }, { secondary_managers: manager }, { _id: { $in: selected } }] }, [{ $set: {
    reporter: { $cond: [{ $and: [{ $eq: ['$reporter', manager] }, { $not: [{ $in: ['$_id', selected] }] }] }, null, '$reporter'] },
    secondary_managers: { $cond: [
      { $and: [{ $in: ['$_id', selected] }, { $ne: [{ $ifNull: ['$reporter', null] }, manager] }] },
      { $setUnion: [{ $ifNull: ['$secondary_managers', []] }, [manager]] },
      { $setDifference: [{ $ifNull: ['$secondary_managers', []] }, [manager]] },
    ] },
  } }]);
};

module.exports = { validateReportingMentors, syncReportingMentors };
