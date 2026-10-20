import { useContext } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'

const Header = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { setUserInfo } = useContext(AppContext)
    const isLoggedIn = Boolean(localStorage.getItem('accessToken'))

    const handleLogout = () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('userInfo')
        setUserInfo({})
        navigate('/', { replace: true })
    }

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <Link className="site-header__brand" to="/" aria-current={location.pathname === '/' ? 'page' : undefined}>
                    My App
                </Link>
                {isLoggedIn && (
                    <button className="site-header__logout" type="button" onClick={handleLogout}>
                        יציאה
                    </button>
                )}
            </div>
        </header>
    )
}

export default Header