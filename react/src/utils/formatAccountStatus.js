import formatPrice from './formatPrice'

const formatAccountStatus = (balance) => {
    const numericBalance = Number(balance)

    return {
        label: numericBalance < 0 ? 'חוב' : 'יתרה',
        amount: formatPrice(Math.abs(numericBalance))
    }
}

export default formatAccountStatus
