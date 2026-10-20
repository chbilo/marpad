import { useContext, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const ExistingUserPage = () => {
    const { setUserInfo } = useContext(AppContext)
    const [code, setCode] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const response = await axios.post('http://localhost:7100/api/auth/login', { code })
            if (!response.data.accessToken) {
                throw new Error('Login response did not include an access token')
            }
            localStorage.setItem('accessToken', response.data.accessToken)
            localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo))
            setUserInfo(response.data.userInfo)
            navigate(response.data.userInfo.roles === 'Admin' ? '/admin' : '/welcome')
        } catch (error) {
            setError(error.response?.data?.message || error.message || 'ההתחברות נכשלה. בדקו את הפרטים ונסו שוב.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form className="login-form" onSubmit={handleSubmit}>
            <h1 className="page-title">כניסה לחשבון</h1>
            <label className="form-field">
                <span>תעודת זהות</span>
                <input
                    type="password"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    autoComplete="current-password"
                    inputMode="numeric"
                    pattern="[0-9]{9}"
                    minLength={9}
                    maxLength={9}
                    required
                />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="action-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'מתחבר...' : 'כניסה'}
            </button>
            <Link className="action-button action-button--secondary" to="/">חזרה</Link>
        </form>
    )
}

export default ExistingUserPage
