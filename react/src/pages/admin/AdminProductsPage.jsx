import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'
import formatPrice from '../../utils/formatPrice'

const PRODUCTS_URL = 'http://localhost:7100/api/products'

const AdminProductsPage = () => {
    let userInfo = {}
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
        userInfo = {}
    }

    const [products, setProducts] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const token = localStorage.getItem('accessToken')
    const authConfig = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        let isCurrent = true
        axios.get(PRODUCTS_URL)
            .then(({ data }) => {
                if (isCurrent) setProducts(data)
            })
            .catch(() => {
                if (isCurrent) setError('טעינת המוצרים נכשלה.')
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

    const resetForm = () => {
        setEditingId(null)
        setName('')
        setPrice('')
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSaving(true)
        try {
            const { data } = await axios.put(PRODUCTS_URL, {
                id: editingId,
                name: name.trim(),
                price: Number(price)
            }, authConfig)
            setProducts((current) => current.map((product) => product._id === editingId ? data : product))
            resetForm()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'עדכון המוצר נכשל.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (productId) => {
        setError('')
        try {
            await axios.delete(`${PRODUCTS_URL}/${productId}`, authConfig)
            setProducts((current) => current.filter((product) => product._id !== productId))
            if (editingId === productId) resetForm()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'מחיקת המוצר נכשלה.')
        }
    }

    return (
        <section className="admin-page">
            <header className="products-header">
                <h1 className="page-title">עדכון מוצרים</h1>
                <Link className="action-button action-button--secondary" to="/admin">לתפריט ניהול</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}
            {editingId && (
                <form className="admin-product-form" onSubmit={handleSubmit}>
                    <h2>עריכת מוצר</h2>
                    <label className="form-field">
                        <span>שם המוצר</span>
                        <input value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label className="form-field">
                        <span>מחיר בש״ח</span>
                        <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required />
                    </label>
                    <div className="admin-form-actions">
                        <button className="action-button" type="submit" disabled={isSaving}>{isSaving ? 'שומר...' : 'שמירת שינויים'}</button>
                        <button className="action-button action-button--secondary" type="button" onClick={resetForm}>ביטול</button>
                    </div>
                </form>
            )}
            {isLoading ? <p role="status">טוען מוצרים...</p> : products.length === 0 ? <p>אין מוצרים להצגה כרגע.</p> : (
                <ul className="product-list">
                    {products.map((product) => (
                        <li className="product-row admin-product-row" key={product._id}>
                            <div className="admin-product-info">
                                <h2>{product.name}</h2>
                                <p>{formatPrice(product.price)}</p>
                            </div>
                            <div className="admin-product-actions">
                                <button className="action-button action-button--secondary" type="button" onClick={() => {
                                    setEditingId(product._id)
                                    setName(product.name)
                                    setPrice(String(product.price))
                                }}>עריכה</button>
                                <button className="action-button action-button--danger" type="button" onClick={() => handleDelete(product._id)}>מחיקה</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default AdminProductsPage
