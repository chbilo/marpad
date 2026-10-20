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
    const [additionalAmount, setAdditionalAmount] = useState(() => String(location.state?.additionalAmount ?? 0))
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

    const cartItems = cart.items || []
    const cartTotal = cartItems.reduce((total, item) => {
        const product = item.product
        return total + (product ? Number(product.price) * item.quantity : 0)
    }, 0)
    const parsedAdditionalAmount = Number(additionalAmount)
    const isAdditionalAmountValid = Number.isFinite(parsedAdditionalAmount) && parsedAdditionalAmount >= 0
    const orderTotal = cartTotal + (isAdditionalAmountValid ? parsedAdditionalAmount : 0)
    const currentBalance = Number(userInfo.balance ?? 0)
    const expectedBalance = currentBalance - orderTotal

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
                    isAdditionalAmountValid={isAdditionalAmountValid}
                    expectedBalance={expectedBalance}
                    onAdditionalAmountChange={setAdditionalAmount}
                    onQuantityChange={handleQuantityChange}
                    onRemove={handleRemoveFromCart}
                />

                <section className="store-products" aria-labelledby="products-title">
                    {isLoadingProducts ? (
                        <p role="status">טוען מוצרים...</p>
                    ) : products.length === 0 ? (
                        <p>אין מוצרים להצגה כרגע.</p>
                    ) : (
                        <ul className="product-list">
                            {products.map((product) => (
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
                        </ul>
                    )}
                </section>
            </div>
        </div>
    )
}

export default ProductsPage
