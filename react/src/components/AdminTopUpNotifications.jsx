import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { io } from 'socket.io-client'
import formatPrice from '../utils/formatPrice'

const TOPUPS_URL = 'http://localhost:7100/api/topups'

const playNotificationTone = (audioContext) => {
    const notes = [880, 1174]
    notes.forEach((frequency, index) => {
        const startTime = audioContext.currentTime + index * 0.14
        const oscillator = audioContext.createOscillator()
        const volume = audioContext.createGain()
        oscillator.frequency.setValueAtTime(frequency, startTime)
        volume.gain.setValueAtTime(0.001, startTime)
        volume.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02)
        volume.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12)
        oscillator.connect(volume)
        volume.connect(audioContext.destination)
        oscillator.start(startTime)
        oscillator.stop(startTime + 0.13)
    })
}

const addUniqueRequests = (current, incoming) => {
    const knownIds = new Set(current.map((request) => request.id))
    return [...current, ...incoming.filter((request) => !knownIds.has(request.id))]
}

const AdminTopUpNotifications = () => {
    const token = localStorage.getItem('accessToken')
    const userInfo = (() => {
        try {
            return JSON.parse(localStorage.getItem('userInfo') || '{}')
        } catch {
            return {}
        }
    })()
    const isAdmin = userInfo.roles === 'Admin'
    const [requests, setRequests] = useState([])
    const [error, setError] = useState('')
    const [approvingId, setApprovingId] = useState('')
    const audioContextRef = useRef(null)
    const soundEnabledRef = useRef(false)
    const activeRequest = requests[0]

    useEffect(() => {
        if (!token || !isAdmin) return undefined

        let isCurrent = true
        const handleSoundToggle = async (event) => {
            const enabled = event.detail.enabled
            soundEnabledRef.current = enabled
            if (!enabled) return

            try {
                const AudioContextConstructor = window.AudioContext
                if (!AudioContextConstructor) throw new Error('Audio is not supported')
                audioContextRef.current ??= new AudioContextConstructor()
                await audioContextRef.current.resume()
                playNotificationTone(audioContextRef.current)
            } catch {
                soundEnabledRef.current = false
                setError('לא ניתן להפעיל צלילים בדפדפן זה.')
                window.dispatchEvent(new CustomEvent('admin:sound-state', { detail: { enabled: false } }))
                window.dispatchEvent(new CustomEvent('admin:sound-error', {
                    detail: { message: 'לא ניתן להפעיל צלילים בדפדפן זה.' }
                }))
            }
        }
        const handleSoundStateRequest = () => {
            window.dispatchEvent(new CustomEvent('admin:sound-state', {
                detail: { enabled: soundEnabledRef.current }
            }))
        }
        window.addEventListener('admin:sound-toggle', handleSoundToggle)
        window.addEventListener('admin:sound-state-request', handleSoundStateRequest)
        const socket = io('http://localhost:7100', { auth: { token } })
        socket.on('topup:requested', (request) => {
            if (soundEnabledRef.current && audioContextRef.current?.state === 'running') {
                playNotificationTone(audioContextRef.current)
            }
            setRequests((current) => addUniqueRequests(current, [request]))
            window.dispatchEvent(new CustomEvent('admin:topup-requested', { detail: request }))
        })
        socket.on('topup:approved', ({ requestId }) => {
            setRequests((current) => current.filter((request) => request.id !== requestId))
            window.dispatchEvent(new CustomEvent('admin:topup-approved', { detail: { requestId } }))
        })
        socket.on('topup:rejected', ({ requestId }) => {
            setRequests((current) => current.filter((request) => request.id !== requestId))
            window.dispatchEvent(new CustomEvent('admin:topup-rejected', { detail: { requestId } }))
        })

        axios.get(`${TOPUPS_URL}/pending`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(({ data }) => {
            if (isCurrent) setRequests((current) => addUniqueRequests(current, data))
        }).catch((requestError) => {
            if (isCurrent) setError(requestError.response?.data?.message || 'טעינת בקשות ההטענה נכשלה.')
        })

        return () => {
            isCurrent = false
            socket.disconnect()
            window.removeEventListener('admin:sound-toggle', handleSoundToggle)
            window.removeEventListener('admin:sound-state-request', handleSoundStateRequest)
            audioContextRef.current?.close()
        }
    }, [token, isAdmin])

    const handleApprove = async (request) => {
        setError('')
        setApprovingId(request.id)
        try {
            await axios.post(`${TOPUPS_URL}/${request.id}/approve`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setRequests((current) => current.filter((item) => item.id !== request.id))
            window.dispatchEvent(new CustomEvent('admin:topup-approved', {
                detail: { requestId: request.id }
            }))
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'אישור ההטענה נכשל.')
        } finally {
            setApprovingId('')
        }
    }

    const handleDismiss = (requestId) => {
        setRequests((current) => current.filter((request) => request.id !== requestId))
    }

    const handleReject = async (request) => {
        setError('')
        setApprovingId(request.id)
        try {
            await axios.post(`${TOPUPS_URL}/${request.id}/reject`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setRequests((current) => current.filter((item) => item.id !== request.id))
            window.dispatchEvent(new CustomEvent('admin:topup-rejected', {
                detail: { requestId: request.id }
            }))
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'דחיית ההטענה נכשלה.')
        } finally {
            setApprovingId('')
        }
    }

    if (!isAdmin) return null

    return (
        <>
            {activeRequest && (
                <div className="admin-topup-modal-backdrop">
                    <section className="admin-topup-modal" role="alertdialog" aria-modal="true" aria-labelledby="topup-modal-title">
                        <h2 id="topup-modal-title">בקשת הטענת מזומן</h2>
                        <p>לקוח: <strong>{activeRequest.customerName}</strong></p>
                        <p>סכום: <strong>{formatPrice(activeRequest.amount)}</strong></p>
                        <p>אם הכסף אכן שולם במזומן, לחץ אישור.</p>
                        {error && <p className="form-error" role="alert">{error}</p>}
                        <div className="admin-topup-modal__actions">
                            <button
                                className="action-button"
                                type="button"
                                disabled={approvingId === activeRequest.id}
                                onClick={() => handleApprove(activeRequest)}
                            >
                                {approvingId === activeRequest.id ? 'מעדכן יתרה...' : 'אישור'}
                            </button>
                            <button
                                className="action-button action-button--danger"
                                type="button"
                                disabled={approvingId === activeRequest.id}
                                onClick={() => handleReject(activeRequest)}
                            >
                                {approvingId === activeRequest.id ? 'דוחה...' : 'דחייה'}
                            </button>
                            <button
                                className="action-button action-button--secondary"
                                type="button"
                                disabled={approvingId === activeRequest.id}
                                onClick={() => handleDismiss(activeRequest.id)}
                            >
                                סגירה
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    )
}

export default AdminTopUpNotifications