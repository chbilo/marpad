import { Link } from 'react-router-dom'
import formatPrice from '../utils/formatPrice'

const CartView = ({
    items,
    isLoading,
    total,
    additionalAmount,
    isAdditionalAmountValid,
    expectedBalance,
    onAdditionalAmountChange,
    onQuantityChange,
    onRemove
}) => {
    const isInsufficient = expectedBalance < 0

    return (
        <aside className="cart-panel" aria-labelledby="cart-title">
            <h2 id="cart-title">העגלה שלי</h2>
            {isLoading ? (
                <p role="status">טוען עגלה...</p>
            ) : items.length === 0 ? (
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
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            <div className="cart-total">
                {items.length > 0 && !isLoading && (
                    <label className="form-field cart-additional-field">
                        <span>סכום נוסף לתשלום (אופציונלי)</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={additionalAmount}
                            onChange={(event) => onAdditionalAmountChange(event.target.value)}
                        />
                    </label>
                )}
                {Number(additionalAmount) > 0 && (
                    <div className="cart-total__row">
                        <span>תשלום נוסף</span>
                        <strong>{formatPrice(additionalAmount)}</strong>
                    </div>
                )}
                <div className="cart-total__row">
                    <span>סך הכול לתשלום</span>
                    <strong>{formatPrice(total)}</strong>
                </div>
                <div className="cart-total__row">
                    <span>{isInsufficient ? 'סכום שחסר' : 'יתרה צפויה לאחר הקנייה'}</span>
                    <strong className={isInsufficient ? 'cart-total__warning' : undefined}>
                        {formatPrice(isInsufficient ? Math.abs(expectedBalance) : expectedBalance)}
                    </strong>
                </div>
                {isInsufficient && (
                    <p className="cart-insufficient" role="alert">
                        אין מספיק יתרה לכיסוי הקנייה.
                    </p>
                )}
                {isInsufficient ? (
                    <Link
                        className="action-button action-button--secondary cart-checkout-link"
                        to="/top-up"
                        state={{
                            returnTo: '/products',
                            returnState: { additionalAmount: Number(additionalAmount) || 0 }
                        }}
                    >
                        להטענת כסף
                    </Link>
                ) : (
                    <Link
                        className={`action-button cart-checkout-link${items.length === 0 || isLoading || !isAdditionalAmountValid ? ' action-button--disabled' : ''}`}
                        to={items.length === 0 || isLoading || !isAdditionalAmountValid ? '#' : '/checkout'}
                        state={{ additionalAmount: Number(additionalAmount) || 0 }}
                        aria-disabled={items.length === 0 || isLoading || !isAdditionalAmountValid}
                        onClick={(event) => {
                            if (items.length === 0 || isLoading || !isAdditionalAmountValid) event.preventDefault()
                        }}
                    >
                        סיום הקנייה
                    </Link>
                )}
            </div>
        </aside>
    )
}

export default CartView
