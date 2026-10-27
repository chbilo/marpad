import { Link } from 'react-router-dom'
import formatPrice from '../utils/formatPrice'
import formatAccountStatus from '../utils/formatAccountStatus'

const CartView = ({
    items,
    isLoading,
    total,
    additionalAmount,
    onCustomAmountChange,
    expectedBalance,
    isGuest,
    onQuantityChange,
    onRemove,
    onRemoveCustomAmount
}) => {
    const accountStatus = isGuest && expectedBalance < 0
        ? { label: 'סכום חסר להשלמת הקנייה', amount: formatPrice(Math.abs(expectedBalance)) }
        : formatAccountStatus(expectedBalance)
    const hasItems = items.length > 0 || Number(additionalAmount) > 0

    return (
        <aside className="cart-panel" aria-labelledby="cart-title">
            <h2 id="cart-title">העגלה שלי</h2>
            {isLoading ? (
                <p role="status">טוען עגלה...</p>
            ) : !hasItems ? (
                <p className="cart-empty">העגלה ריקה</p>
            ) : (
                <ul className="cart-list">
                    {items.map((item) => item.product && (
                        <li className="cart-item" key={item.product._id}>
                            <div className="cart-item__details">
                                <h3>{item.product.name}</h3>
                                <p>{formatPrice(Number(item.product.price) * item.quantity)}</p>
                            </div>
                            <div className="cart-item__controls">
                                {item.cartItemType === 'custom' ? (
                                    <>
                                        <label>
                                            <span className="visually-hidden">סכום עבור אחר בש״ח</span>
                                            <input
                                                type="number"
                                                min="0.01"
                                                step="0.01"
                                                value={additionalAmount}
                                                onChange={(event) => onCustomAmountChange(event.target.value)}
                                            />
                                        </label>
                                        <button className="remove-cart-item" type="button" onClick={onRemoveCustomAmount}>
                                            הסרה
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <label>
                                            <span className="visually-hidden">כמות עבור {item.product.name}</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(event) => onQuantityChange(item.product._id, event.target.value)}
                                            />
                                        </label>
                                        <button
                                            className="remove-cart-item"
                                            type="button"
                                            aria-label={`הסרת ${item.product.name} מהעגלה`}
                                            onClick={() => onRemove(item.product._id)}
                                        >
                                            הסרה
                                        </button>
                                    </>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="cart-total">
                <div className="cart-total__row">
                    <span>עלות הקנייה הנוכחית</span>
                    <strong>{formatPrice(total)}</strong>
                </div>
                <div className="cart-total__row">
                    <span>
                        {isGuest && expectedBalance < 0
                            ? accountStatus.label
                            : `${accountStatus.label} לאחר הקנייה`}
                    </span>
                    <strong>{accountStatus.amount}</strong>
                </div>
                {isGuest && expectedBalance < 0 && (
                    <p className="cart-insufficient">
                        אורח אינו יכול לצבור חוב. יש להטעין כסף לפני השלמת הקנייה.
                    </p>
                )}
                {isGuest && expectedBalance < 0 && (
                    <Link
                        className="action-button action-button--secondary cart-checkout-link"
                        to="/top-up"
                        state={{
                            returnTo: '/products',
                            returnState: { additionalAmount: Number(additionalAmount) || 0 }
                        }}
                    >
                        הטענת כסף
                    </Link>
                )}
                <Link
                    className={`action-button cart-checkout-link${!hasItems || isLoading ? ' action-button--disabled' : ''}`}
                    to={!hasItems || isLoading ? '#' : '/checkout'}
                    state={{ additionalAmount: Number(additionalAmount) || 0 }}
                    aria-disabled={!hasItems || isLoading}
                    onClick={(event) => {
                        if (!hasItems || isLoading) event.preventDefault()
                    }}
                >
                    סיום הקנייה
                </Link>
            </div>
        </aside>
    )
}

export default CartView
