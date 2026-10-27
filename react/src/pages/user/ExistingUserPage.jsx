import { useContext, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const ExistingUserPage = () => {
    const { setUserInfo } = useContext(AppContext)
    const [code, setCode] = useState('')
    const [loginMode, setLoginMode] = useState('user')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const isAdminLogin = loginMode === 'admin'
            const endpoint = isAdminLogin ? '/admin/login' : '/login'
            const response = await axios.post(`http://localhost:7100/api/auth${endpoint}`, { code })
            if (!response.data.accessToken) {
                throw new Error('Login response did not include an access token')
            }
            localStorage.setItem('accessToken', response.data.accessToken)
            localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
            setUserInfo(response.data.userInfo)
            navigate(isAdminLogin ? '/admin' : '/welcome')
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'ההתחברות נכשלה. בדקו את הפרטים ונסו שוב.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <h1 className="page-title">כניסה לחשבון</h1>
            <div className="login-mode-selector" role="group" aria-label="סוג כניסה">
                <button
                    className={`login-mode-selector__button${loginMode === 'user' ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={loginMode === 'user'}
                    onClick={() => {
                        setLoginMode('user')
                        setCode('')
                        setError('')
                    }}
                >
                    כניסת משתמש
                </button>
                <button
                    className={`login-mode-selector__button${loginMode === 'admin' ? ' is-active' : ''}`}
                    type="button"
                    aria-pressed={loginMode === 'admin'}
                    onClick={() => {
                        setLoginMode('admin')
                        setCode('')
                        setError('')
                    }}
                >
                    כניסת מנהל
                </button>
            </div>
            <label className="form-field">
                <span>{loginMode === 'admin' ? 'קוד ניהול' : 'תעודת זהות'}</span>
                <input
                    type="password"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    autoComplete={loginMode === 'admin' ? 'off' : 'current-password'}
                    inputMode={loginMode === 'admin' ? 'text' : 'numeric'}
                    pattern={loginMode === 'admin' ? undefined : '[0-9]{9}'}
                    minLength={loginMode === 'admin' ? undefined : 9}
                    maxLength={loginMode === 'admin' ? undefined : 9}
                    required
                />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="action-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'מתחבר...' : loginMode === 'admin' ? 'כניסת מנהל' : 'כניסה'}
            </button>
            <Link className="action-button action-button--secondary" to="/">חזרה</Link>
        </form>
    )
}

export default ExistingUserPage
