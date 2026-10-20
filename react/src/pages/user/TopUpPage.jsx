import { useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AppContext } from '../../context/AppContext'

const TOPUPS_URL = 'http://localhost:7100/api/topups'

const TopUpPage = () => {
    const { setUserInfo } = useContext(AppContext)
    const { state } = useLocation()
    const returnTo = state?.returnTo || '/welcome'
    const returnLocation = state?.returnState
        ? { pathname: returnTo, state: state.returnState }
        : returnTo
    const token = localStorage.getItem('accessToken')
    const [amount, setAmount] = useState('')
    const [request, setRequest] = useState(null)
    const [error, setError] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const approvedRequests = useRef(new Map())
    const rejectedRequests = useRef(new Set())

    useEffect(() => {
        if (!token) return undefined

        const socket = io('http://localhost:7100', { auth: { token } })
        socket.on('topup:approved', (approval) => {
            approvedRequests.current.set(approval.requestId, approval)
            const userInfo = (() => {
                try {
                    return JSON.parse(localStorage.getItem('userInfo') || '{}')
                } catch {
                    return {}
                }
            })()
            const updatedUserInfo = { ...userInfo, balance: approval.balance }
            localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo))
            setUserInfo(updatedUserInfo)
            setRequest((current) => current?.id === approval.requestId
                ? { ...current, status: 'approved', balance: approval.balance }
                : current)
        })
            socket.on('topup:rejected', ({ requestId }) => {
                rejectedRequests.current.add(requestId)
                setRequest((current) => current?.id === requestId
                ? { ...current, status: 'rejected' }
                : current)
            })

        return () => socket.disconnect()
    }, [token, setUserInfo])

    const handleSubmit = async (event) => {
        event.preventDefault()
        const value = Number(amount)
        if (!Number.isFinite(value) || value < 20) {
            setError('יש להזין סכום של 20 ש״ח לפחות.')
            return
        }

        setError('')
        setIsSubmitting(true)
        try {
            const { data } = await axios.post(TOPUPS_URL, { amount: value }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            const newRequest = { ...data.request, status: 'pending' }
            const approval = approvedRequests.current.get(newRequest.id)
            setRequest(rejectedRequests.current.has(newRequest.id)
                ? { ...newRequest, status: 'rejected' }
                : approval
                    ? { ...newRequest, status: 'approved', balance: approval.balance }
                    : newRequest)
            setAmount('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'שליחת בקשת ההטענה נכשלה.')
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!token) return <Navigate to="/" replace />

    return (
        <form className="top-up-form" onSubmit={handleSubmit}>
            <h1 className="page-title">הטענת כסף</h1>
            <p className="top-up-cash-note">יש לשלם במזומן למרפדית וללחוץ על אישור.</p>
            <label className="form-field">
                <span>סכום בש״ח</span>
                <input
                    type="number"
                    min="20"
                    step="0.01"
                    value={amount}
                    onChange={(event) => {
                        setAmount(event.target.value)
                        setError('')
                    }}
                    required
                />
            </label>
            <p className="top-up-minimum">מינימום 20 ש״ח</p>
            {error && <p className="form-error" role="alert">{error}</p>}
            {request?.status === 'pending' && (
                <p className="top-up-confirmation" role="status">
                    הבקשה נשלחה למנהל וממתינה לאישור.
                </p>
            )}
            {request?.status === 'approved' && (
                <p className="top-up-confirmation" role="status">
                    ההטענה אושרה והיתרה עודכנה.
                </p>
            )}
            {request?.status === 'rejected' && (
                <p className="form-error" role="alert">
                    בקשת ההטענה נדחתה על ידי המנהל.
                </p>
            )}
            <button className="action-button" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'שולח בקשה...' : 'אישור'}
            </button>
            <Link className="action-button action-button--secondary" to={returnLocation}>חזרה</Link>
        </form>
    )
}

export default TopUpPage
