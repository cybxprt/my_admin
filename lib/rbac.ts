export const defaultRoles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  OPERATOR: 'OPERATOR',
  ANALYST: 'ANALYST',
  VIEWER: 'VIEWER',
};

export const defaultPermissions = [
  'users.read',
  'users.write',
  'network.read',
  'network.write',
  'devices.read',
  'devices.write',
  'agents.read',
  'alerts.read',
  'alerts.write',
  'security.read',
  'system.read',
  'developer.read',
];
