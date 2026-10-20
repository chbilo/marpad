import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'
import formatAccountStatus from '../../utils/formatAccountStatus'

const WelcomePage = () => {
    const { userInfo } = useContext(AppContext)
    const name = userInfo.name
    const accountStatus = formatAccountStatus(userInfo.balance)

    return (
        <section className="welcome-view">
            <h1 className="page-title">
                {name ? `ברוכה הבאה, ${name}` : 'ברוכים הבאים'}
            </h1>
            <div className="welcome-balance">
                <p className="welcome-balance__label">{accountStatus.label}</p>
                <p className="welcome-balance__amount">
                    {accountStatus.amount}
                </p>
            </div>
            <div className="welcome-actions">
                <Link className="action-button action-button--secondary" to="/products">ביצוע רכישה</Link>
                <Link className="action-button action-button--secondary" to="/profile">הפרטים שלי</Link>
            </div>
        </section>
    )
}

export default WelcomePage
