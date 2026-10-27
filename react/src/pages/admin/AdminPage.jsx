import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'
import formatPrice from '../../utils/formatPrice'

const TOPUPS_URL = 'http://localhost:7100/api/topups'

const AdminPage = () => {
    const userInfo = (() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo') || '{}')
        } catch {
            return {}
        }
    })()

    const token = localStorage.getItem('accessToken')
    const isAdmin = userInfo.roles === 'Admin'
    const [pendingTopUps, setPendingTopUps] = useState([])
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [approvingId, setApprovingId] = useState('')
    const [soundEnabled, setSoundEnabled] = useState(false)

    useEffect(() => {
        if (!token || !isAdmin) return undefined

        let isCurrent = true
        const authConfig = { headers: { Authorization: `Bearer ${token}` } }
        axios.get(`${TOPUPS_URL}/pending`, authConfig)
            .then(({ data }) => {
                if (isCurrent) setPendingTopUps(data)
            })
            .catch((requestError) => {
                if (isCurrent) setError(requestError.response?.data?.message || 'טעינת בקשות ההטענה נכשלה.')
            })

        const handleRequested = (event) => {
            const request = event.detail
            setPendingTopUps((current) => current.some((item) => item.id === request.id)
                ? current
                : [...current, request])
        }
        const handleApproved = (event) => {
            setPendingTopUps((current) => current.filter((item) => item.id !== event.detail.requestId))
        }
        const handleRejected = (event) => {
            setPendingTopUps((current) => current.filter((item) => item.id !== event.detail.requestId))
        }
        const handleSoundState = (event) => setSoundEnabled(event.detail.enabled)
        const handleSoundError = (event) => setError(event.detail.message)
        window.addEventListener('admin:topup-requested', handleRequested)
        window.addEventListener('admin:topup-approved', handleApproved)
        window.addEventListener('admin:topup-rejected', handleRejected)
        window.addEventListener('admin:sound-state', handleSoundState)
        window.addEventListener('admin:sound-error', handleSoundError)
        window.dispatchEvent(new Event('admin:sound-state-request'))

        return () => {
            isCurrent = false
            window.removeEventListener('admin:topup-requested', handleRequested)
            window.removeEventListener('admin:topup-approved', handleApproved)
            window.removeEventListener('admin:topup-rejected', handleRejected)
            window.removeEventListener('admin:sound-state', handleSoundState)
            window.removeEventListener('admin:sound-error', handleSoundError)
        }
    }, [token, isAdmin])

    if (!isAdmin) {
        return <Navigate to={token ? '/welcome' : '/'} replace />
    }

    const handleSoundToggle = (event) => {
        const enabled = event.currentTarget.checked
        setSoundEnabled(enabled)
        window.dispatchEvent(new CustomEvent('admin:sound-toggle', { detail: { enabled } }))
    }

    const handleApprove = async (request) => {
        setError('')
        setSuccess('')
        setApprovingId(request.id)
        try {
            await axios.post(`${TOPUPS_URL}/${request.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPendingTopUps((current) => current.filter((item) => item.id !== request.id))
            setSuccess(`ההטענה של ${request.customerName} אושרה.`)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'אישור ההטענה נכשל.')
        } finally {
            setApprovingId('')
        }
    }

    const handleReject = async (request) => {
        setError('')
        setSuccess('')
        setApprovingId(request.id)
        try {
            await axios.post(`${TOPUPS_URL}/${request.id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPendingTopUps((current) => current.filter((item) => item.id !== request.id))
            setSuccess(`בקשת ההטענה של ${request.customerName} נדחתה.`)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'דחיית ההטענה נכשלה.')
        } finally {
            setApprovingId('')
        }
    }

    return (
        <section className="admin-view">
            <header>
                <h1 className="page-title">ניהול</h1>
                <p className="admin-view__greeting">שלום, {userInfo.name || 'מנהל'}</p>
            </header>
            <section className="admin-topups" aria-labelledby="topups-title">
                <div className="admin-topups__heading">
                    <h2 id="topups-title">בקשות להטענת מזומן</h2>
                    <label className="admin-sound-toggle">
                        <input type="checkbox" checked={soundEnabled} onChange={handleSoundToggle} />
                        <span>צליל לבקשות</span>
                    </label>
                </div>
                {error && <p className="form-error" role="alert">{error}</p>}
                {success && <p className="profile-success" role="status">{success}</p>}
                {pendingTopUps.length === 0 ? (
                    <p className="admin-topups__empty">אין בקשות שממתינות לאישור.</p>
                ) : (
                    <ul className="product-list topup-request-list">
                        {pendingTopUps.map((request) => (
                            <li className="product-row topup-request-row" key={request.id}>
                                <div className="topup-request-copy">
                                    <p>לקוח: {request.customerName}</p>
                                    <p>מבקש להטעין: {formatPrice(request.amount)}</p>
                                    <p>אם הכסף אכן שולם במזומן, לחץ אישור.</p>
                                </div>
                                <div className="admin-product-actions">
                                    <button
                                        className="action-button"
                                        type="button"
                                        disabled={approvingId === request.id}
                                        onClick={() => handleApprove(request)}
                                    >
                                        {approvingId === request.id ? 'מעדכן יתרה...' : 'אישור'}
                                    </button>
                                    <button
                                        className="action-button action-button--danger"
                                        type="button"
                                        disabled={approvingId === request.id}
                                        onClick={() => handleReject(request)}
                                    >
                                        {approvingId === request.id ? 'דוחה...' : 'דחייה'}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
            <nav className="admin-menu" aria-label="פעולות ניהול">
                <Link className="action-button admin-menu__button" to="/admin/products">עדכון מוצרים</Link>
                <Link className="action-button admin-menu__button" to="/admin/users">עדכון משתמשים</Link>
                <Link className="action-button admin-menu__button" to="/admin/products/new">מוצר חדש</Link>
            </nav>
        </section>
    )
}

export default AdminPage
