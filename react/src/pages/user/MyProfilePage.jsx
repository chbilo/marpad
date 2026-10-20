import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'

const USERS_URL = 'http://localhost:7100/api/users'

const MyProfilePage = () => {
    const token = localStorage.getItem('accessToken')
    let userInfo = {}
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
        userInfo = {}
    }

    const [name, setName] = useState(userInfo.name || '')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const authConfig = { headers: { Authorization: `Bearer ${token}` } }

    useEffect(() => {
        let isCurrent = true
        if (!token || !userInfo._id) {
            setError('לא נמצאו פרטי משתמש. התחברו מחדש.')
            setIsLoading(false)
            return undefined
        }

        axios.get(`${USERS_URL}/${userInfo._id}`, authConfig)
            .then(({ data }) => {
                if (isCurrent) setName(data.name || '')
            })
            .catch((requestError) => {
                if (isCurrent) setError(requestError.response?.data?.message || 'טעינת הפרטים נכשלה.')
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })

        return () => {
            isCurrent = false
        }
    }, [token, userInfo._id])

    if (!token) return <Navigate to="/" replace />

    const handleSubmit = async (event) => {
        event.preventDefault()
        setError('')
        setSuccess('')
        setIsSaving(true)
        try {
            const { data } = await axios.put(USERS_URL, {
                id: userInfo._id,
                name: name.trim()
            }, authConfig)
            localStorage.setItem('userInfo', JSON.stringify({ ...userInfo, name: data.name }))
            setName(data.name)
            setSuccess('הפרטים עודכנו בהצלחה.')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'עדכון הפרטים נכשל.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <section className="profile-page">
            <header className="products-header">
                <h1 className="page-title">הפרטים שלי</h1>
                <Link className="action-button action-button--secondary" to="/welcome">חזרה</Link>
            </header>
            {isLoading ? <p role="status">טוען פרטים...</p> : (
                <form className="profile-form" onSubmit={handleSubmit}>
                    <label className="form-field">
                        <span>שם</span>
                        <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
                    </label>
                    {error && <p className="form-error" role="alert">{error}</p>}
                    {success && <p className="profile-success" role="status">{success}</p>}
                    <button className="action-button" type="submit" disabled={isSaving}>
                        {isSaving ? 'שומר...' : 'שמירת פרטים'}
                    </button>
                </form>
            )}
            {error && isLoading && <p className="form-error" role="alert">{error}</p>}
        </section>
    )
}

export default MyProfilePage
