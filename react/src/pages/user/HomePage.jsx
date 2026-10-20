import { Link } from 'react-router-dom'

const HomePage = () => (
    <nav className="home-actions" aria-label="בחירת משתמש">
        <Link className="action-button action-button--large" to="/existing-user">
            משתמש קיים
        </Link>
        <Link className="action-button action-button--large" to="/register">
            משתמש חדש
        </Link>
    </nav>
)

export default HomePage
