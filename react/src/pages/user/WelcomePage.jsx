import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const WelcomePage = () => {
    const { userInfo } = useContext(AppContext)
    const name = userInfo.name
    const balance = Number(userInfo.balance ?? 0)

    return (
        <section className="welcome-view">
            <h1 className="page-title">
                {name ? `ברוכה הבאה, ${name}` : 'ברוכים הבאים'}
            </h1>
            <div className="welcome-balance">
                <p className="welcome-balance__label">היתרה הנוכחית</p>
                <p className="welcome-balance__amount">
                    {balance.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>
            <div className="welcome-actions">
                <Link className="action-button" to="/top-up">הטענת כסף</Link>
                <Link className="action-button action-button--secondary" to="/products">ביצוע רכישה</Link>
                <Link className="action-button action-button--secondary" to="/profile">הפרטים שלי</Link>
            </div>
        </section>
    )
}

export default WelcomePage
