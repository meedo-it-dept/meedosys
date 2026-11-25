/**
 * Shared PocketBase v0.23+ access rules and auth collection config for MEEDOSys.
 */
const APPROVED_AUTH = '@request.auth.id != "" && @request.auth.status = "Approved"';
const IS_ADMIN = '(@request.auth.role = "Admin" || @request.auth.section = "ALL")';
const ADMIN_RULE = `${APPROVED_AUTH} && ${IS_ADMIN}`;
const secRule = (sec) => `${APPROVED_AUTH} && (${IS_ADMIN} || @request.auth.section = "${sec}")`;

const PROFILE_AUTH_CONFIG = {
  authRule: 'status = "Approved"',
  manageRule: ADMIN_RULE,
  passwordAuth: {
    enabled: false,
    identityFields: ['email', 'username'],
  },
};

function getCollectionRules(name) {
  if (name === 'profiles') {
    return {
      listRule: `${APPROVED_AUTH} && (${IS_ADMIN} || id = @request.auth.id)`,
      viewRule: `${APPROVED_AUTH} && (${IS_ADMIN} || id = @request.auth.id)`,
      createRule: ADMIN_RULE,
      updateRule: ADMIN_RULE,
      deleteRule: ADMIN_RULE,
    };
  }
  if (name === 'audit_logs') {
    return {
      listRule: ADMIN_RULE,
      viewRule: ADMIN_RULE,
      createRule: APPROVED_AUTH,
      updateRule: null,
      deleteRule: null,
    };
  }
  if (['stalls', 'stall_tenants', 'monitoring_records', 'electric_bills'].includes(name)) {
    const r = secRule('A');
    return { listRule: r, viewRule: r, createRule: r, updateRule: r, deleteRule: r };
  }
  if (['slaughter_records', 'butchers'].includes(name)) {
    const r = secRule('B');
    return { listRule: r, viewRule: r, createRule: r, updateRule: r, deleteRule: r };
  }
  if (name === 'cemetery_bookings') {
    const r = secRule('C');
    return { listRule: r, viewRule: r, createRule: r, updateRule: r, deleteRule: r };
  }
  if (['todas', 'toda_members'].includes(name)) {
    const r = secRule('D');
    return { listRule: r, viewRule: r, createRule: r, updateRule: r, deleteRule: r };
  }
  if (name === 'csu_daily_reports') {
    const r = secRule('F');
    return { listRule: r, viewRule: r, createRule: r, updateRule: r, deleteRule: ADMIN_RULE };
  }
  if (name === 'market_guards') {
    const r = secRule('F');
    return { listRule: r, viewRule: r, createRule: ADMIN_RULE, updateRule: ADMIN_RULE, deleteRule: ADMIN_RULE };
  }
  if (name === 'market_calendar_events') {
    const r = secRule('F');
    return { listRule: r, viewRule: r, createRule: ADMIN_RULE, updateRule: r, deleteRule: ADMIN_RULE };
  }
  if (name === 'opif_indicators') {
    const readRule = `${APPROVED_AUTH} && (${IS_ADMIN} || section = @request.auth.section)`;
    const updateRule = `${APPROVED_AUTH} && (${IS_ADMIN} || (section = @request.auth.section && (@request.body.section:isset = false || @request.body.section = @request.auth.section)))`;
    return {
      listRule: readRule,
      viewRule: readRule,
      createRule: ADMIN_RULE,
      updateRule,
      deleteRule: ADMIN_RULE,
    };
  }
  // inventory_items, inventory_transactions, inventory_adjustments
  return {
    listRule: ADMIN_RULE,
    viewRule: ADMIN_RULE,
    createRule: ADMIN_RULE,
    updateRule: ADMIN_RULE,
    deleteRule: ADMIN_RULE,
  };
}

module.exports = {
  APPROVED_AUTH,
  IS_ADMIN,
  ADMIN_RULE,
  PROFILE_AUTH_CONFIG,
  getCollectionRules,
};
