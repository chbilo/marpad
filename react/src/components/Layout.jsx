import { useContext, useEffect } from 'react'
import axios from 'axios'
import { Outlet } from "react-router-dom"
import Header from "./Header"
import { AppContext } from '../context/AppContext'

const Layout = () => {
    const token = localStorage.getItem('accessToken')
    const { userInfo, setUserInfo } = useContext(AppContext)
    const userId = userInfo._id

    useEffect(() => {
        if (!token || !userId) return undefined

        let isCurrent = true
        axios.get(`http://localhost:7100/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(({ data }) => {
            if (!isCurrent) return
            localStorage.setItem('userInfo', JSON.stringify(data))
            setUserInfo(data)
        }).catch((requestError) => {
            if (!isCurrent || ![401, 404].includes(requestError.response?.status)) return
            localStorage.removeItem('accessToken')
            localStorage.removeItem('userInfo')
            setUserInfo({})
        })

        return () => {
            isCurrent = false
        }
    }, [token, userId, setUserInfo])

    return (
        <>
            <Header />
            <main className="page-content">
                <Outlet />
            </main>
        </>
    )
}

export default Layout