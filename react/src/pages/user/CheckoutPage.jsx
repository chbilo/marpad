import { useContext, useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Navigate, useLocation } from 'react-router-dom'
import formatPrice from '../../utils/formatPrice'
import formatAccountStatus from '../../utils/formatAccountStatus'
import { AppContext } from '../../context/AppContext'

const API_URL = 'http://localhost:7100/api/cart'

const CheckoutPage = () => {
    const { userInfo, setUserInfo } = useContext(AppContext)
    const location = useLocation()
    const requestedAdditionalAmount = Number(location.state?.additionalAmount ?? 0)
    const additionalAmount = Number.isFinite(requestedAdditionalAmount) && requestedAdditionalAmount >= 0
        ? Math.round(requestedAdditionalAmount * 100) / 100
        : 0
    const [items, setItems] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPaying, setIsPaying] = useState(false)
    const [error, setError] = useState('')
    const [receipt, setReceipt] = useState(null)
    const [requiresTopUp, setRequiresTopUp] = useState(false)
    const token = localStorage.getItem('accessToken')
    const isGuest = userInfo.accountType === 'Other'
    const authConfig = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        let isCurrent = true
        axios.get(API_URL, authConfig)
            .then(({ data }) => {
                if (isCurrent) setItems(data.items || [])
            })
            .catch(() => {
                if (isCurrent) setError('לא ניתן לטעון את העגלה. התחברו מחדש ונסו שוב.')
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [])

    const subtotal = items.reduce((sum, item) => (
        sum + (item.product ? Number(item.product.price) * item.quantity : 0)
    ), 0)
    const total = subtotal + additionalAmount
    const balance = Number(userInfo.balance ?? 0)
    const expectedBalance = balance - total

    if (!token) {
        return <Navigate to="/" replace />
    }

    const handlePay = async () => {
        setError('')
        setIsPaying(true)
        try {
            const { data } = await axios.post(`${API_URL}/checkout`, { additionalAmount }, authConfig)
            setReceipt(data)
            const updatedUserInfo = { ...userInfo, balance: data.balance }
            setUserInfo(updatedUserInfo)
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
            setItems([])
        } catch (requestError) {
            if (requestError.response?.data?.code === 'INSUFFICIENT_GUEST_BALANCE') {
                setRequiresTopUp(true)
                setError('אורח חייב להטעין כסף לפני השלמת הקנייה.')
                return
            }
            setError(requestError.response?.data?.message || 'אישור הקנייה נכשל. נסו שוב.')
        } finally {
            setIsPaying(false)
        }
    }

    if (receipt) {
        return (
            <section className="checkout-page" aria-labelledby="checkout-title">
                <h1 className="page-title" id="checkout-title">הקנייה הושלמה</h1>
                <p className="checkout-success" role="status">הקנייה הושלמה והיתרה עודכנה.</p>
                <div className="checkout-totals">
                    <div><span>סך הכול לקנייה</span><strong>{formatPrice(receipt.total)}</strong></div>
                    <div>
                        <span>{formatAccountStatus(receipt.balance).label} לאחר הקנייה</span>
                        <strong>{formatAccountStatus(receipt.balance).amount}</strong>
                    </div>
                </div>
                <p className="checkout-balance-note">הנפקת קבלות - במזכירות הסמינר.</p>
                <Link className="action-button" to="/welcome">חזרה לחשבון</Link>
            </section>
        )
    }

    return (
        <section className="checkout-page" aria-labelledby="checkout-title">
            <header className="products-header">
                <h1 className="page-title" id="checkout-title">סיכום הקנייה</h1>
                <Link className="action-button action-button--secondary" to="/products">חזרה למוצרים</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            {isLoading ? (
                <p role="status">טוען סיכום...</p>
            ) : items.length === 0 && additionalAmount <= 0 ? (
                <div className="checkout-empty">
                    <p>אין מוצרים בעגלה.</p>
                    <Link className="action-button" to="/products">בחירת מוצרים</Link>
                </div>
            ) : (
                <>
                    <ul className="checkout-items">
                        {items.map((item) => item.product && (
                            <li className="checkout-item" key={item.product._id}>
                                <div>
                                    <h2>{item.product.name}</h2>
                                    <p>{formatPrice(item.product.price)} × {item.quantity}</p>
                                </div>
                                <strong>{formatPrice(Number(item.product.price) * item.quantity)}</strong>
                            </li>
                        ))}
                        {additionalAmount > 0 && (
                            <li className="checkout-item" key="custom-additional">
                                <div>
                                    <h2>אחר</h2>
                                    <p>סכום שהוזן ידנית</p>
                                </div>
                                <strong>{formatPrice(additionalAmount)}</strong>
                            </li>
                        )}
                    </ul>
                    <div className="checkout-totals">
                        <div><span>עלות הקנייה הנוכחית</span><strong>{formatPrice(total)}</strong></div>
                        <div className="checkout-balance">
                            <span>
                                {isGuest && expectedBalance < 0
                                    ? 'סכום חסר להשלמת הקנייה'
                                    : `${formatAccountStatus(expectedBalance).label} לאחר הקנייה`}
                            </span>
                            <strong>
                                {isGuest && expectedBalance < 0
                                    ? formatPrice(Math.abs(expectedBalance))
                                    : formatAccountStatus(expectedBalance).amount}
                            </strong>
                        </div>
                    </div>
                    {(requiresTopUp || (isGuest && expectedBalance < 0)) && (
                        <div className="checkout-insufficient" role="status">
                            <p>
                                {isGuest
                                    ? 'אורח אינו יכול לצבור חוב, ולכן יש להטעין כסף לפני השלמת הקנייה.'
                                    : 'אפשר להמשיך בקנייה ולצבור חוב, או להטעין כסף לפני הקנייה.'}
                            </p>
                            <Link
                                className="action-button action-button--secondary"
                                to="/top-up"
                                state={{ returnTo: '/checkout', returnState: { additionalAmount } }}
                            >
                                הטענת כסף
                            </Link>
                        </div>
                    )}
                    <button
                        className="action-button checkout-pay"
                        type="button"
                        disabled={isPaying || (isGuest && expectedBalance < 0) || requiresTopUp}
                        onClick={handlePay}
                    >
                        {isPaying ? 'רושם קנייה...' : 'אישור קנייה'}
                    </button>
                </>
            )}
        </section>
    )
}

export default CheckoutPage
