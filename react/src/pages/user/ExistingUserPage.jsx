import { useContext, useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const ExistingUserPage = () => {
    const { setUserInfo } = useContext(AppContext)
    const [name, setName] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            const response = await axios.post('http://localhost:7100/api/auth/login', {
                name,
                password
            })
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
            <h1 className="page-title">
                הזנת שם וסיסמה
            </h1>
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
                    autoComplete="current-password"
                    required
                />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="action-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'מתחבר...' : 'אישור'}
            </button>
            <Link className="action-button action-button--secondary" to="/">
                חזרה
            </Link>
        </form>
    )
}

export default ExistingUserPage
