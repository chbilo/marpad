import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import CartView from '../../components/CartView'
import formatPrice from '../../utils/formatPrice'
import { useContext } from 'react'
import { AppContext } from '../../context/AppContext'

const ProductsPage = () => {
    const { userInfo } = useContext(AppContext)
    const location = useLocation()
    const [products, setProducts] = useState([])
    const [cart, setCart] = useState({ items: [] })
    const [searchTerm, setSearchTerm] = useState('')
    const [additionalAmount, setAdditionalAmount] = useState(() => String(location.state?.additionalAmount ?? 0))
    const [customAmount, setCustomAmount] = useState('')
    const [isLoadingProducts, setIsLoadingProducts] = useState(true)
    const [isLoadingCart, setIsLoadingCart] = useState(true)
    const [pendingProductId, setPendingProductId] = useState('')
    const [error, setError] = useState('')
    const token = localStorage.getItem('accessToken')
    const cartConfig = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        let isCurrent = true

        axios.get('http://localhost:7100/api/products')
            .then(({ data }) => {
                if (isCurrent) setProducts(data)
            })
            .catch(() => {
                if (isCurrent) setError('לא ניתן לטעון את המוצרים כרגע.')
            })
            .finally(() => {
                if (isCurrent) setIsLoadingProducts(false)
            })

        axios.get('http://localhost:7100/api/cart', cartConfig)
            .then(({ data }) => {
                if (isCurrent) setCart(data)
            })
            .catch(() => {
                if (isCurrent) setError('לא ניתן לטעון את העגלה. התחברו מחדש ונסו שוב.')
            })
            .finally(() => {
                if (isCurrent) setIsLoadingCart(false)
            })

        return () => {
            isCurrent = false
        }
    }, [])

    const updateCart = async (request) => {
        setError('')
        try {
            const { data } = await request
            setCart(data)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'עדכון העגלה נכשל.')
        }
    }

    const handleAddToCart = async (productId) => {
        setPendingProductId(productId)
        await updateCart(axios.post('http://localhost:7100/api/cart/items', { productId }, cartConfig))
        setPendingProductId('')
    }

    const handleQuantityChange = (productId, quantity) => {
        const parsedQuantity = Number(quantity)
        if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) return
        updateCart(axios.put('http://localhost:7100/api/cart/items', {
            productId,
            quantity: parsedQuantity
        }, cartConfig))
    }

    const handleRemoveFromCart = (productId) => {
        updateCart(axios.delete(`http://localhost:7100/api/cart/items/${productId}`, cartConfig))
    }

    const handleAddCustomAmount = () => {
        const amount = Number(customAmount)
        if (!Number.isFinite(amount) || amount <= 0) {
            setError('יש להזין סכום חיובי עבור הפריט "אחר".')
            return
        }
        setError('')
        setAdditionalAmount(String(Math.round(amount * 100) / 100))
        setCustomAmount('')
    }

    const cartItems = (cart.items || []).map((item) => ({ ...item, cartItemType: 'product' }))
    if (Number(additionalAmount) > 0) {
        cartItems.push({
            cartItemType: 'custom',
            product: { _id: 'custom-additional', name: 'אחר', price: Number(additionalAmount) },
            quantity: 1
        })
    }
    const cartTotal = (cart.items || []).reduce((total, item) => {
        const product = item.product
        return total + (product ? Number(product.price) * item.quantity : 0)
    }, 0)
    const parsedAdditionalAmount = Number(additionalAmount)
    const validAdditionalAmount = Number.isFinite(parsedAdditionalAmount) && parsedAdditionalAmount > 0
        ? parsedAdditionalAmount
        : 0
    const orderTotal = cartTotal + validAdditionalAmount
    const currentBalance = Number(userInfo.balance ?? 0)
    const expectedBalance = currentBalance - orderTotal
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase()
    const filteredProducts = products.filter((product) => (
        product.name.toLocaleLowerCase().includes(normalizedSearchTerm)
    ))

    return (
        <div className="store-page">
            <header className="products-header">
                <h1 className="page-title" id="products-title">ביצוע רכישה</h1>
                <Link className="action-button action-button--secondary" to="/welcome">חזרה</Link>
            </header>
            {error && <p className="form-error store-error" role="alert">{error}</p>}
            <div className="store-layout">
                <CartView
                    items={cartItems}
                    isLoading={isLoadingCart}
                    total={orderTotal}
                    additionalAmount={additionalAmount}
                    expectedBalance={expectedBalance}
                    isGuest={userInfo.accountType === 'Other'}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveFromCart}
                    onRemoveCustomAmount={() => setAdditionalAmount('0')}
                    onCustomAmountChange={setAdditionalAmount}
                />

                <section className="store-products" aria-labelledby="products-title">
                    {isLoadingProducts ? (
                        <p role="status">טוען מוצרים...</p>
                    ) : (
                        <>
                            <label className="form-field store-products__search">
                                <span>חיפוש מוצרים</span>
                                <input
                                    type="search"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="הקלידו שם מוצר"
                                />
                            </label>
                            <ul className="product-list">
                                {filteredProducts.map((product) => (
                                    <li className="product-row" key={product._id}>
                                        <div className="store-product__details">
                                            <h2>{product.name}</h2>
                                            <p>{formatPrice(product.price)}</p>
                                        </div>
                                        <button
                                            className="action-button"
                                            type="button"
                                            disabled={pendingProductId === product._id}
                                            onClick={() => handleAddToCart(product._id)}
                                        >
                                            {pendingProductId === product._id ? 'מוסיף...' : 'הוספה לעגלה'}
                                        </button>
                                    </li>
                                ))}
                                {filteredProducts.length === 0 && (
                                    <li className="product-row">לא נמצאו מוצרים מתאימים.</li>
                                )}
                                <li className="product-row" key="custom-amount">
                                    <div className="store-product__details">
                                        <h2>אחר</h2>
                                        <label className="form-field">
                                            <span>הזנת סכום בש״ח</span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={customAmount}
                                                onChange={(event) => setCustomAmount(event.target.value)}
                                            />
                                        </label>
                                    </div>
                                    <button className="action-button" type="button" onClick={handleAddCustomAmount}>
                                        הוספת אחר לעגלה
                                    </button>
                                </li>
                            </ul>
                        </>
                    )}
                </section>
            </div>
        </div>
    )
}

export default ProductsPage
