// RBAC服务功能测试脚本
import rbacService from './src/services/rbacService.js';

console.log('=== RBAC服务功能测试 ===\n');

// 测试1: 获取所有权限
console.log('1. 获取所有权限:');
const allPermissions = rbacService.getAllPermissions();
console.log(`权限数量: ${allPermissions.length}`);
allPermissions.slice(0, 5).forEach(perm => {
    console.log(`  - ${perm.id}: ${perm.name} (${perm.resource}.${perm.action})`);
});

// 测试2: 获取所有角色
console.log('\n2. 获取所有角色:');
const allRoles = rbacService.getAllRoles();
console.log(`角色数量: ${allRoles.length}`);
allRoles.forEach(role => {
    console.log(`  - ${role.id}: ${role.name} (权限数: ${role.permissions.length})`);
});

// 测试3: 为用户分配角色并测试权限
console.log('\n3. 角色分配和权限测试:');
const testUserId = 'test-user-123';

// 分配普通用户角色
rbacService.assignRole(testUserId, 'user');
console.log(`✓ 为用户 ${testUserId} 分配了 'user' 角色`);

// 测试权限检查
console.log('\n权限检查结果:');
const testCases = [
    { resource: 'post', action: 'read', expected: true, description: '查看作品' },
    { resource: 'post', action: 'write', expected: true, description: '创建作品' },
    { resource: 'post', action: 'admin', expected: false, description: '作品管理' },
    { resource: 'admin', action: 'dashboard', expected: false, description: '访问管理后台' },
    { resource: 'community', action: 'comment', expected: true, description: '发表评论' }
];

testCases.forEach(testCase => {
    const hasPermission = rbacService.can(testUserId, testCase.resource, testCase.action);
    const status = hasPermission === testCase.expected ? '✓' : '✗';
    console.log(`  ${status} ${testCase.description}: ${hasPermission} (预期: ${testCase.expected})`);
});

// 测试4: 为用户分配管理员角色并重新测试
console.log('\n4. 分配管理员角色后测试:');
rbacService.assignRole(testUserId, 'admin');
console.log(`✓ 为用户 ${testUserId} 分配了 'admin' 角色`);

// 重新测试权限
console.log('\n权限检查结果 (管理员角色):');
testCases.forEach(testCase => {
    const hasPermission = rbacService.can(testUserId, testCase.resource, testCase.action);
    const status = hasPermission === true ? '✓' : '✗'; // 管理员应该拥有所有权限
    console.log(`  ${status} ${testCase.description}: ${hasPermission} (预期: true)`);
});

// 测试5: 获取用户权限列表
console.log('\n5. 获取用户所有权限:');
const userPermissions = rbacService.getUserPermissions(testUserId);
console.log(`用户权限数量: ${userPermissions.length}`);
userPermissions.slice(0, 10).forEach(perm => {
    console.log(`  - ${perm.id}: ${perm.name}`);
});

console.log('\n=== RBAC服务功能测试完成 ===');