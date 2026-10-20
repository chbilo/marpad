import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'
import formatPrice from '../../utils/formatPrice'

const USERS_URL = 'http://localhost:7100/api/users'

const AdminUsersPage = () => {
    let userInfo = {}
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
        userInfo = {}
    }

    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState('')
    const [name, setName] = useState('')
    const [balance, setBalance] = useState('')
    const token = localStorage.getItem('accessToken')
    const authConfig = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        let isCurrent = true
        axios.get(USERS_URL, authConfig)
            .then(({ data }) => {
                if (isCurrent) setUsers(data)
            })
            .catch((requestError) => {
                if (isCurrent) setError(requestError.response?.data?.message || 'טעינת המשתמשים נכשלה.')
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [])

    if (userInfo.roles !== 'Admin') {
        return <Navigate to={token ? '/welcome' : '/'} replace />
    }

    const handleSave = async (event) => {
        event.preventDefault()
        setError('')
        try {
            const { data } = await axios.put(USERS_URL, {
                id: editingId,
                name: name.trim(),
                balance: Number(balance)
            }, authConfig)
            setUsers((current) => current.map((user) => user._id === editingId ? data : user))
            setEditingId('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'עדכון המשתמש נכשל.')
        }
    }

    const handleDelete = async (userId) => {
        setError('')
        try {
            await axios.delete(`${USERS_URL}/${userId}`, authConfig)
            setUsers((current) => current.filter((user) => user._id !== userId))
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'מחיקת המשתמש נכשלה.')
        }
    }

    return (
        <section className="admin-page">
            <header className="products-header">
                <h1 className="page-title">עדכון משתמשים</h1>
                <Link className="action-button action-button--secondary" to="/admin">לתפריט ניהול</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            {editingId && (
                <form className="admin-product-form" onSubmit={handleSave}>
                    <h2>עריכת משתמש</h2>
                    <label className="form-field">
                        <span>שם</span>
                        <input value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label className="form-field">
                        <span>יתרה בש״ח</span>
                        <input type="number" min="0" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} required />
                    </label>
                    <div className="admin-form-actions">
                        <button className="action-button" type="submit">שמירת שינויים</button>
                        <button className="action-button action-button--secondary" type="button" onClick={() => setEditingId('')}>ביטול</button>
                    </div>
                </form>
            )}
            {isLoading ? <p role="status">טוען משתמשים...</p> : users.length === 0 ? <p>אין משתמשים להצגה.</p> : (
                <ul className="product-list">
                    {users.map((user) => (
                        <li className="product-row admin-product-row" key={user._id}>
                            <div className="admin-product-info">
                                <h2>{user.name}</h2>
                                <p>{user.roles}</p>
                                <p>{formatPrice(user.balance || 0)}</p>
                            </div>
                            <div className="admin-product-actions">
                                <button className="action-button action-button--secondary" type="button" onClick={() => {
                                    setEditingId(user._id)
                                    setName(user.name)
                                    setBalance(String(user.balance || 0))
                                }}>עריכה</button>
                                <button className="action-button action-button--danger" type="button" onClick={() => handleDelete(user._id)}>מחיקה</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default AdminUsersPage
