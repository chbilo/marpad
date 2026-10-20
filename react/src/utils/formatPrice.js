const formatPrice = (price) => Number(price).toLocaleString('he-IL', {
    style: 'currency',
    currency: 'ILS'
})

export default formatPrice
