import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from './components/Layout'
import HomePage from './pages/user/HomePage'
import ExistingUserPage from './pages/user/ExistingUserPage'
import WelcomePage from './pages/user/WelcomePage'
import TopUpPage from './pages/user/TopUpPage'
import ProductsPage from './pages/user/ProductsPage'
import AdminPage from './pages/admin/AdminPage'
import RegisterPage from './pages/user/RegisterPage'
import CheckoutPage from './pages/user/CheckoutPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminNewProductPage from './pages/admin/AdminNewProductPage'
import MyProfilePage from './pages/user/MyProfilePage'
import { useState } from 'react'
import { AppContext } from './context/AppContext'

export { AppContext }

function App() {
  const [crud, setCrud] = useState(0)
  const [userInfo, setUserInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userInfo') || '{}')
    } catch {
      return {}
    }
  })

  return (
    <AppContext.Provider value={{ crud, setCrud, userInfo, setUserInfo }}>
      <Router>
        <Routes>
          <Route path='/' element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path='existing-user' element={<ExistingUserPage />} />
            <Route path='register' element={<RegisterPage />} />
            <Route path='welcome' element={<WelcomePage />} />
            <Route path='top-up' element={<TopUpPage />} />
            <Route path='profile' element={<MyProfilePage />} />
            <Route path='products' element={<ProductsPage />} />
            <Route path='checkout' element={<CheckoutPage />} />
            <Route path='admin' element={<AdminPage />} />
            <Route path='admin/products' element={<AdminProductsPage />} />
            <Route path='admin/products/new' element={<AdminNewProductPage />} />
            <Route path='admin/users' element={<AdminUsersPage />} />
          </Route>
        </Routes>
      </Router>
    </AppContext.Provider>
  )
}

export default App
