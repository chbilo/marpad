import { Link, Navigate } from 'react-router-dom'

const AdminPage = () => {
    const userInfo = (() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo') || '{}')
        } catch {
            return {}
        }
    })()

    const isAdmin = userInfo.roles === 'Admin'
    if (!isAdmin) {
        return <Navigate to={localStorage.getItem('accessToken') ? '/welcome' : '/'} replace />
    }

    return (
        <section className="admin-view">
            <header>
                <h1 className="page-title">ניהול</h1>
                <p className="admin-view__greeting">שלום, {userInfo.name}</p>
            </header>
            <nav className="admin-menu" aria-label="פעולות ניהול">
                <Link className="action-button admin-menu__button" to="/admin/products">עדכון מוצרים</Link>
                <Link className="action-button admin-menu__button" to="/admin/users">עדכון משתמשים</Link>
                <Link className="action-button admin-menu__button" to="/admin/products/new">מוצר חדש</Link>
            </nav>
        </section>
    )
}

export default AdminPage
