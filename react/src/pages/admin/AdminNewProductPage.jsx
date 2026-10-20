import { useState } from 'react'
import axios from 'axios'
import { Link, Navigate, useNavigate } from 'react-router-dom'

const AdminNewProductPage = () => {
    let userInfo = {}
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
        userInfo = {}
    }

    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [error, setError] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const navigate = useNavigate()
    const token = localStorage.getItem('accessToken')

    if (userInfo.roles !== 'Admin') {
        return <Navigate to={token ? '/welcome' : '/'} replace />
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSaving(true)
        try {
            await axios.post('http://localhost:7100/api/products', {
                name: name.trim(),
                price: Number(price)
            }, { headers: { Authorization: `Bearer ${token}` } })
            navigate('/admin/products')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'יצירת המוצר נכשלה.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="admin-page">
            <header className="products-header">
                <h1 className="page-title">מוצר חדש</h1>
                <Link className="action-button action-button--secondary" to="/admin">לתפריט ניהול</Link>
            </header>
            <form className="register-form" onSubmit={handleSubmit}>
                <label className="form-field">
                    <span>שם המוצר</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>
                <label className="form-field">
                    <span>מחיר בש״ח</span>
                    <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
                </label>
                {error && <p className="form-error" role="alert">{error}</p>}
                <button className="action-button" type="submit" disabled={isSaving}>{isSaving ? 'שומר...' : 'הוספת מוצר'}</button>
            </form>
        </section>
    )
}

export default AdminNewProductPage
