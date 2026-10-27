const hasAdminAccess = (user) => (
    user?.roles === 'Admin'
    && user.authMethod === 'admin-code'
    && Number.isInteger(user.exp)
)

module.exports = hasAdminAccess
