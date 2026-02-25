// 测试 typeMapping
const typeMapping = {
  'private_message': 'private',
  'direct_message': 'private',
  'reply': 'reply',
  'comment_reply': 'reply',
  'post_commented': 'reply',
  'mention': 'mention',
  'at_mention': 'mention',
  'comment_replied': 'mention',
  'like': 'like',
  'post_liked': 'like',
  'comment_liked': 'like',
  'work_liked': 'like',
  'follow': 'follow',
  'user_followed': 'follow',
  'new_follower': 'follow',
  'system': 'system',
  'announcement': 'system',
  'ranking_published': 'system',
  'feedback_resolved': 'system',
  'invitation_received': 'system',
  'invitation_accepted': 'system',
  'application_approved': 'system',
  'application_rejected': 'system',
};

const filterType = 'system';
const dbTypes = Object.entries(typeMapping)
  .filter(([_, v]) => v === filterType)
  .map(([k]) => k);

console.log('Filter type:', filterType);
console.log('DB types:', dbTypes);
