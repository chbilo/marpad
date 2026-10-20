import { useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'

const RegisterPage = () => {
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isRegistered, setIsRegistered] = useState(false)

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            await axios.post('http://localhost:7100/api/auth/register', { name, password })
            setIsRegistered(true)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'ההרשמה נכשלה. נסו שוב.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isRegistered) {
        return (
            <section className="register-form" aria-labelledby="register-success-title">
                <h1 className="page-title" id="register-success-title">ההרשמה הושלמה</h1>
                <p className="register-success">אפשר להתחבר עכשיו עם הסיסמה שבחרת.</p>
                <Link className="action-button" to="/existing-user">מעבר להתחברות</Link>
                <Link className="action-button action-button--secondary" to="/">חזרה</Link>
            </section>
        )
    }

    return (
        <form className="register-form" onSubmit={handleSubmit}>
            <h1 className="page-title">הרשמת משתמש חדש</h1>
            <label className="form-field">
                <span>שם</span>
                <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    required
                />
            </label>
            <label className="form-field">
                <span>סיסמה</span>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="new-password"
                    required
                />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="action-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'נרשם...' : 'הרשמה'}
            </button>
            <Link className="action-button action-button--secondary" to="/">חזרה</Link>
        </form>
    )
}

export default RegisterPage
