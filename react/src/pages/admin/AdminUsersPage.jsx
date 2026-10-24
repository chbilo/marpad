import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Link, Navigate } from 'react-router-dom'
import formatAccountStatus from '../../utils/formatAccountStatus'

const USERS_URL = 'http://localhost:7100/api/users'
const ACCOUNT_TYPE_LABELS = { Student: 'תלמיד', Staff: 'צוות', Other: 'אורח' }

const ImportCard = ({ accountTypeMode, title, description, authConfig, onImported }) => {
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [busy, setBusy] = useState(false)

    const handlePreview = async (event) => {
        event.preventDefault()
        if (!file) return
        setError('')
        setSuccess('')
        setPreview(null)
        setBusy(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const { data } = await axios.post(
                `${USERS_URL}/import/preview?accountType=${accountTypeMode}`,
                formData,
                authConfig
            )
            setPreview(data)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'בדיקת הקובץ נכשלה.')
        } finally {
            setBusy(false)
        }
    }

    const handleImport = async () => {
        if (!file || !preview?.newCount) return
        setError('')
        setSuccess('')
        setBusy(true)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const { data } = await axios.post(
                `${USERS_URL}/import?accountType=${accountTypeMode}`,
                formData,
                authConfig
            )
            setSuccess(`נוספו ${data.importedCount} חשבונות. דולגו ${data.skippedCount}.`)
            if (data.errors?.length) {
                setError(`לא נשמרו הנתונים בשורות: ${data.errors.map((item) => item.rowNumber).join(', ')}.`)
            }
            setPreview(null)
            setFile(null)
            const input = document.getElementById(`import-file-${accountTypeMode}`)
            if (input) input.value = ''
            onImported()
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'ייבוא החשבונות נכשל.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className="user-transfer-card" aria-label={title}>
            <div className="user-transfer-card__heading">
                <span className="user-transfer-card__icon" aria-hidden="true">↑</span>
                <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>
            <form className="user-transfer-form" onSubmit={handlePreview}>
                <label className="form-field" htmlFor={`import-file-${accountTypeMode}`}>
                    <span>קובץ Excel (.xlsx)</span>
                    <input
                        id={`import-file-${accountTypeMode}`}
                        type="file"
                        accept=".xlsx"
                        onChange={(event) => {
                            setFile(event.target.files?.[0] || null)
                            setPreview(null)
                            setError('')
                            setSuccess('')
                        }}
                    />
                </label>
                <button className="action-button" type="submit" disabled={!file || busy}>
                    {busy ? 'בודק...' : 'בדיקת הקובץ'}
                </button>
            </form>
            {error && <p className="form-error" role="alert">{error}</p>}
            {success && <p className="import-success" role="status">{success}</p>}
            {preview && (
                <div className="student-import-preview">
                    <p className="user-import-summary">
                        נמצאו {preview.totalRows} שורות: {preview.newCount} חדשים,
                        {' '}{preview.existingCount} כבר קיימים,
                        {' '}{preview.duplicateInFileCount} כפילויות,
                        {' '}{preview.invalidCount} שגיאות.
                    </p>
                    <div className="student-import-table-wrap">
                        <table className="student-import-table">
                            <thead>
                                <tr>
                                    <th>שורה</th>
                                    <th>שם</th>
                                    {accountTypeMode === 'all' && <th>סוג</th>}
                                    <th>כיתה</th>
                                    <th>תוצאה</th>
                                </tr>
                            </thead>
                            <tbody>
                                {preview.rows.map((row) => (
                                    <tr key={row.rowNumber}>
                                        <td>{row.rowNumber}</td>
                                        <td>{row.name || '—'}</td>
                                        {accountTypeMode === 'all' && <td>{ACCOUNT_TYPE_LABELS[row.accountType] || '—'}</td>}
                                        <td>{row.className || '—'}</td>
                                        <td>
                                            {row.status === 'new' ? 'חדש' : null}
                                            {row.status === 'exists' ? 'כבר קיים — ידולג' : null}
                                            {row.status === 'duplicate-in-file' ? 'כפילות בקובץ — תידלג' : null}
                                            {row.status === 'invalid' ? row.errors.join(', ') : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <button className="action-button" type="button" onClick={handleImport} disabled={!preview.newCount || busy}>
                        {busy ? 'מייבא...' : `ייבוא ${preview.newCount} חשבונות חדשים`}
                    </button>
                </div>
            )}
        </section>
    )
}

const ExportCard = ({ accountType, title, description, authConfig }) => {
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')

    const handleExport = async () => {
        setBusy(true)
        setError('')
        try {
            const { data } = await axios.get(`${USERS_URL}/export?accountType=${accountType}`, {
                ...authConfig,
                responseType: 'blob'
            })
            const downloadUrl = URL.createObjectURL(data)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = accountType === 'all'
                ? 'all-accounts-debts.xlsx'
                : accountType === 'Staff' ? 'staff-debts.xlsx'
                    : accountType === 'Other' ? 'guest-debts.xlsx' : 'student-debts.xlsx'
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000)
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'ייצוא הקובץ נכשל.')
        } finally {
            setBusy(false)
        }
    }

    return (
        <section className="user-transfer-card" aria-label={title}>
            <div className="user-transfer-card__heading">
                <span className="user-transfer-card__icon user-transfer-card__icon--export" aria-hidden="true">↓</span>
                <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>
            <button className="action-button action-button--secondary" type="button" onClick={handleExport} disabled={busy}>
                {busy ? 'מכין קובץ...' : 'ייצוא לאקסל'}
            </button>
            {error && <p className="form-error" role="alert">{error}</p>}
        </section>
    )
}

const TransferSection = ({ title, description, accountType, importDescription, authConfig, onImported }) => (
    <section className="user-transfer-section" aria-labelledby={`transfer-${accountType}-title`}>
        <header className="user-transfer-section__heading">
            <h3 id={`transfer-${accountType}-title`}>{title}</h3>
            <p>{description}</p>
        </header>
        <div className="user-transfer-grid">
            <ImportCard
                accountTypeMode={accountType}
                title="ייבוא מקובץ"
                description={importDescription}
                authConfig={authConfig}
                onImported={onImported}
            />
            <ExportCard
                accountType={accountType}
                title="ייצוא לקובץ"
                description="הורדת רשימה עם היתרה והחוב."
                authConfig={authConfig}
            />
        </div>
    </section>
)

const AdminUsersPage = () => {
    let userInfo
    try {
        userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
        userInfo = {}
    }

    const [users, setUsers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')
    const [editingId, setEditingId] = useState('')
    const [name, setName] = useState('')
    const [className, setClassName] = useState('')
    const [accountType, setAccountType] = useState('Student')
    const [balance, setBalance] = useState('')
    const [usersVersion, setUsersVersion] = useState(0)
    const token = localStorage.getItem('accessToken')
    const authConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token])

    useEffect(() => {
        let isCurrent = true
        axios.get(USERS_URL, authConfig)
            .then(({ data }) => {
                if (isCurrent) setUsers(data)
            })
            .catch((requestError) => {
                if (isCurrent) setError(requestError.response?.data?.message || 'טעינת המשתמשים נכשלה.')
            })
            .finally(() => {
                if (isCurrent) setIsLoading(false)
            })
        return () => {
            isCurrent = false
        }
    }, [authConfig, usersVersion])

    if (userInfo.roles !== 'Admin') {
        return <Navigate to={token ? '/welcome' : '/'} replace />
    }

    const handleSave = async (event) => {
        event.preventDefault()
        setError('')
        try {
            const { data } = await axios.put(USERS_URL, {
                id: editingId,
                name: name.trim(),
                className: accountType === 'Student' ? className.trim() : '',
                accountType,
                balance: Number(balance)
            }, authConfig)
            setUsers((current) => current.map((user) => user._id === editingId ? data : user))
            setEditingId('')
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'עדכון המשתמש נכשל.')
        }
    }

    const handleDelete = async (userId) => {
        setError('')
        try {
            await axios.delete(`${USERS_URL}/${userId}`, authConfig)
            setUsers((current) => current.filter((user) => user._id !== userId))
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'מחיקת המשתמש נכשלה.')
        }
    }

    const refreshUsers = () => {
        setIsLoading(true)
        setUsersVersion((value) => value + 1)
    }

    const startEditing = (user) => {
        setEditingId(user._id)
        setName(user.name)
        setAccountType(user.accountType || 'Student')
        setClassName(user.className || '')
        setBalance(String(user.balance || 0))
    }

    const usersByType = {
        Student: users.filter((user) => (user.accountType || 'Student') === 'Student'),
        Staff: users.filter((user) => user.accountType === 'Staff'),
        Other: users.filter((user) => user.accountType === 'Other')
    }

    return (
        <section className="admin-page admin-users-page">
            <header className="admin-users-page__header">
                <div>
                    <h1 className="page-title">ניהול חשבונות</h1>
                    <p>ייבוא וייצוא של חשבונות, עריכת פרטים וניהול יתרות.</p>
                </div>
                <Link className="action-button action-button--secondary" to="/admin">לתפריט ניהול</Link>
            </header>
            {error && <p className="form-error" role="alert">{error}</p>}

            <section className="user-file-management" aria-labelledby="user-file-management-title">
                <header className="user-file-management__heading">
                    <h2 id="user-file-management-title">ייבוא וייצוא חשבונות</h2>
                    <p>בחרו סוג חשבון כדי להעלות רשימה או להוריד קובץ עם היתרות.</p>
                </header>
                <TransferSection
                    title="כל סוגי החשבונות"
                    description="ייבוא או ייצוא של תלמידים, צוות ואורחים בקובץ אחד."
                    accountType="all"
                    importDescription="יש לכלול תעודת זהות, שם וסוג משתמש (תלמיד, צוות או אורח). כיתה נדרשת לתלמידים."
                    authConfig={authConfig}
                    onImported={refreshUsers}
                />
                <TransferSection
                    title="תלמידים"
                    description="ניהול רשימות התלמידים והחובות שלהם."
                    accountType="Student"
                    importDescription="חובה לכלול תעודת זהות, שם וכיתה."
                    authConfig={authConfig}
                    onImported={refreshUsers}
                />
                <TransferSection
                    title="צוות"
                    description="ניהול רשימות אנשי הצוות והחובות שלהם."
                    accountType="Staff"
                    importDescription="חובה לכלול תעודת זהות ושם. עמודת כיתה אינה נדרשת."
                    authConfig={authConfig}
                    onImported={refreshUsers}
                />
                <TransferSection
                    title="אורחים"
                    description="ניהול רשימות האורחים והחובות שלהם."
                    accountType="Other"
                    importDescription="חובה לכלול תעודת זהות ושם. עמודת כיתה אינה נדרשת."
                    authConfig={authConfig}
                    onImported={refreshUsers}
                />
            </section>

            {editingId && (
                <form className="admin-product-form" aria-labelledby="edit-account-title" onSubmit={handleSave}>
                    <h2 id="edit-account-title">עריכת פרטי חשבון</h2>
                    <label className="form-field">
                        <span>שם</span>
                        <input value={name} onChange={(event) => setName(event.target.value)} required />
                    </label>
                    <label className="form-field">
                        <span>סוג חשבון</span>
                        <select value={accountType} onChange={(event) => setAccountType(event.target.value)}>
                            <option value="Student">תלמיד</option>
                            <option value="Staff">צוות</option>
                            <option value="Other">אורח</option>
                        </select>
                    </label>
                    {accountType === 'Student' && (
                        <label className="form-field">
                            <span>כיתה</span>
                            <input value={className} onChange={(event) => setClassName(event.target.value)} />
                        </label>
                    )}
                    <label className="form-field">
                        <span>יתרה (+) / חוב (-) בש״ח</span>
                        <input type="number" step="0.01" value={balance} onChange={(event) => setBalance(event.target.value)} required />
                    </label>
                    <div className="admin-form-actions">
                        <button className="action-button" type="submit">שמירת שינויים</button>
                        <button className="action-button action-button--secondary" type="button" onClick={() => setEditingId('')}>ביטול</button>
                    </div>
                </form>
            )}

            <section className="user-directory" aria-labelledby="user-directory-title">
                <header className="user-directory__heading">
                    <h2 id="user-directory-title">חשבונות במערכת</h2>
                    <p>החשבונות מחולקים לפי סוג. בכל חשבון מוצגים פרטי המשתמש, ההרשאה והיתרה או החוב.</p>
                </header>
                {isLoading ? <p role="status">טוען חשבונות...</p> : (
                    ['Student', 'Staff', 'Other'].map((type) => (
                        <section className="user-directory-group" key={type}>
                            <header className="user-directory-group__heading">
                                <h3>{type === 'Student' ? 'תלמידים' : type === 'Staff' ? 'צוות' : 'אורחים'}</h3>
                                <span>{usersByType[type].length}</span>
                            </header>
                            {usersByType[type].length === 0 ? <p className="user-directory-empty">אין חשבונות בקטגוריה זו.</p> : (
                                <ul className="product-list">
                                    {usersByType[type].map((user) => {
                                        const accountStatus = formatAccountStatus(user.balance)
                                        return (
                                            <li className="product-row admin-product-row" key={user._id}>
                                                <div className="admin-product-info">
                                                    <h4>{user.name}</h4>
                                                    {type === 'Student' && <p>כיתה: {user.className || 'לא הוגדרה'}</p>}
                                                    <p>סוג חשבון: {ACCOUNT_TYPE_LABELS[type]}</p>
                                                    <p>הרשאה: {user.roles === 'Admin' ? 'מנהל' : 'משתמש'}</p>
                                                    <p>{accountStatus.label}: {accountStatus.amount}</p>
                                                </div>
                                                <div className="admin-product-actions">
                                                    <button className="action-button action-button--secondary" type="button" onClick={() => startEditing(user)}>עריכה</button>
                                                    <button className="action-button action-button--danger" type="button" onClick={() => handleDelete(user._id)}>מחיקה</button>
                                                </div>
                                            </li>
                                        )
                                    })}
                                </ul>
                            )}
                        </section>
                    ))
                )}
            </section>
        </section>
    )
}

export default AdminUsersPage