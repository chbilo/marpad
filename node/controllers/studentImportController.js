const bcrypt = require('bcrypt')
const ExcelJS = require('exceljs')
const JSZip = require('jszip')
const User = require('../models/users')
const { normalizeCode, getCodeLookup, isValidCode } = require('../utils/loginCode')

const normalizeHeader = (value) => String(value ?? '')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase()

const headerAliases = {
    code: ['תעודתזהות', 'מספרזהות', 'תז', 'studentid', 'id', 'logincode'],
    name: ['שם', 'שםהתלמיד', 'fullname', 'name'],
    className: ['כיתה', 'מחלקה', 'classname', 'class'],
    accountType: ['סוגמשתמש', 'סוגחשבון', 'סוג', 'accounttype', 'type', 'category']
}

const getCellText = (cell) => {
    const value = cell.value
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
        if ('text' in value) return String(value.text).trim()
        if ('result' in value) return String(value.result ?? '').trim()
        if ('richText' in value) return value.richText.map((part) => part.text).join('').trim()
        return ''
    }
    return String(value).trim()
}

const normalizeStudentCode = (value) => {
    let code = String(value ?? '').trim().replace(/[\s-]/g, '')
    if (/^\d{8}$/.test(code)) code = `0${code}`
    return code
}

const normalizeAccountType = (value) => {
    const normalized = normalizeHeader(value)
    if (['student', 'תלמיד', 'תלמידה', 'תלמידים'].includes(normalized)) return 'Student'
    if (['staff', 'employee', 'employees', 'צוות', 'עובד', 'עובדת', 'עובדים', 'עובדות'].includes(normalized)) return 'Staff'
    if (['other', 'guest', 'guests', 'אחר', 'אחרים', 'אורח', 'אורחת', 'אורחים', 'אורחות'].includes(normalized)) return 'Other'
    return ''
}

const getHeaderColumns = (headerRow) => {
    const found = {}
    headerRow.eachCell((cell, columnNumber) => {
        const normalized = normalizeHeader(getCellText(cell))
        for (const [key, aliases] of Object.entries(headerAliases)) {
            if (!found[key] && aliases.includes(normalized)) found[key] = columnNumber
        }
    })
    return found
}

const normalizePrefixedWorkbookXml = async (buffer) => {
    const zip = await JSZip.loadAsync(buffer)
    let changed = false

    for (const fileName of Object.keys(zip.files)) {
        if (!fileName.startsWith('xl/') || !fileName.endsWith('.xml')) continue
        const file = zip.file(fileName)
        if (!file) continue

        const xml = await file.async('string')
        const normalizedXml = xml
            .replace(/(<\/?)([A-Za-z_][\w.-]*):/g, '$1')
            .replace(/\sxmlns:x=/g, ' xmlns=')

        if (normalizedXml !== xml) {
            zip.file(fileName, normalizedXml)
            changed = true
        }
    }

    return changed ? zip.generateAsync({ type: 'nodebuffer' }) : buffer
}

const parseStudentWorkbook = async (buffer, accountTypeMode = 'Student') => {
    const workbook = new ExcelJS.Workbook()
    const compatibleBuffer = await normalizePrefixedWorkbookXml(buffer)
    await workbook.xlsx.load(compatibleBuffer)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) throw new Error('בקובץ לא נמצאה לשונית עם נתונים.')

    const columns = getHeaderColumns(worksheet.getRow(1))
    const requiredHeaders = { code: 'תעודת זהות', name: 'שם' }
    if (accountTypeMode === 'Student') requiredHeaders.className = 'כיתה'
    if (accountTypeMode === 'all') requiredHeaders.accountType = 'סוג משתמש'
    const missingHeaders = Object.entries(requiredHeaders)
        .filter(([key]) => !columns[key])
        .map(([, label]) => label)
    if (missingHeaders.length) {
        throw new Error(`חסרות כותרות חובה בשורה הראשונה: ${missingHeaders.join(', ')}.`)
    }

    const parsedRows = []
    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return
        const hasAnyValue = row.values.some((value) => value !== null && value !== undefined && String(value).trim() !== '')
        if (!hasAnyValue) return

        const rawCode = getCellText(row.getCell(columns.code))
        const code = normalizeStudentCode(rawCode)
        const name = getCellText(row.getCell(columns.name))
        const rowAccountType = accountTypeMode === 'all'
            ? normalizeAccountType(getCellText(row.getCell(columns.accountType)))
            : accountTypeMode
        const className = rowAccountType === 'Student' && columns.className
            ? getCellText(row.getCell(columns.className))
            : ''
        const errors = []

        if (!name) errors.push('חסר שם')
        if (!rowAccountType) errors.push('סוג משתמש לא תקין — יש לרשום תלמיד, צוות או אורח')
        if (rowAccountType === 'Student' && !className) errors.push('חסרה כיתה')
        if (!isValidCode(code)) errors.push('תעודת הזהות חייבת להכיל 9 ספרות')

        parsedRows.push({ rowNumber, code, name, className, accountType: rowAccountType, errors })
    })

    return parsedRows
}

const enrichWithDuplicateStatus = async (rows) => {
    const validRows = rows.filter((row) => row.errors.length === 0)
    const lookups = [...new Set(validRows.map((row) => getCodeLookup(normalizeCode(row.code))))]
    const existingUsers = lookups.length
        ? await User.find({ loginCodeLookup: { $in: lookups } }).select('loginCodeLookup').lean()
        : []
    const existingLookups = new Set(existingUsers.map((user) => user.loginCodeLookup))
    const seenInFile = new Set()

    return rows.map((row) => {
        if (row.errors.length) return { ...row, status: 'invalid' }
        const lookup = getCodeLookup(normalizeCode(row.code))
        if (existingLookups.has(lookup)) return { ...row, status: 'exists' }
        if (seenInFile.has(lookup)) return { ...row, status: 'duplicate-in-file' }
        seenInFile.add(lookup)
        return { ...row, status: 'new' }
    })
}

const makePreview = (rows) => {
    const counts = rows.reduce((result, row) => {
        result[row.status] = (result[row.status] || 0) + 1
        return result
    }, {})
    return {
        totalRows: rows.length,
        newCount: counts.new || 0,
        existingCount: counts.exists || 0,
        duplicateInFileCount: counts['duplicate-in-file'] || 0,
        invalidCount: counts.invalid || 0,
        rows: rows.map(({ rowNumber, name, className, accountType, errors, status }) => ({
            rowNumber, name, className, accountType, errors, status
        }))
    }
}

const getImportAccountTypeMode = (req) => {
    const mode = req.query.accountType || 'Student'
    if (!['Student', 'Staff', 'Other', 'all'].includes(mode)) {
        throw new Error('סוג הייבוא אינו תקין.')
    }
    return mode
}

const loadRowsFromRequest = async (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: 'יש לבחור קובץ Excel בפורמט ‎.xlsx.' })
        return null
    }
    try {
        const accountTypeMode = getImportAccountTypeMode(req)
        const rows = await parseStudentWorkbook(req.file.buffer, accountTypeMode)
        return await enrichWithDuplicateStatus(rows)
    } catch (error) {
        res.status(400).json({ message: error.message || 'לא ניתן לקרוא את קובץ Excel.' })
        return null
    }
}

const previewImport = async (req, res) => {
    const rows = await loadRowsFromRequest(req, res)
    if (!rows) return
    res.json(makePreview(rows))
}

const importStudents = async (req, res) => {
    const rows = await loadRowsFromRequest(req, res)
    if (!rows) return

    let importedCount = 0
    let skippedCount = 0
    const importErrors = []

    for (const row of rows) {
        if (row.status !== 'new') {
            skippedCount += 1
            continue
        }

        const code = normalizeCode(row.code)
        try {
            await User.create({
                name: row.name,
                className: row.className,
                accountType: row.accountType,
                password: await bcrypt.hash(code, 10),
                loginCodeLookup: getCodeLookup(code),
                balance: 0
            })
            importedCount += 1
        } catch (error) {
            if (error.code === 11000) {
                skippedCount += 1
                continue
            }
            importErrors.push({ rowNumber: row.rowNumber, message: 'שמירת המשתמש נכשלה' })
        }
    }

    res.status(201).json({ importedCount, skippedCount, errors: importErrors })
}

const exportStudents = async (req, res) => {
    const accountType = req.query.accountType || 'all'
    if (!['Student', 'Staff', 'Other', 'all'].includes(accountType)) {
        return res.status(400).json({ message: 'סוג הייצוא אינו תקין.' })
    }

    const accountTypeFilter = accountType === 'all'
        ? { $or: [
            { accountType: 'Staff' },
            { accountType: 'Student', roles: { $ne: 'Admin' } },
            { accountType: 'Other' },
            { accountType: { $exists: false }, roles: { $ne: 'Admin' } },
            { accountType: { $exists: false }, roles: 'Admin' }
        ] }
        : accountType === 'Student'
            ? { $or: [
                { accountType: 'Student', roles: { $ne: 'Admin' } },
                { accountType: { $exists: false }, roles: { $ne: 'Admin' } }
            ] }
            : accountType === 'Staff'
                ? { $or: [
                { accountType: 'Staff' },
                { accountType: { $exists: false }, roles: 'Admin' }
                ] }
                : { accountType: 'Other' }

    const users = await User.find(accountTypeFilter)
        .select('name className accountType balance roles')
        .sort({ className: 1, name: 1 })
        .lean()

    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Student Store'
    workbook.created = new Date()
    const worksheet = workbook.addWorksheet(accountType === 'all' ? 'חשבונות וחובות' : accountType === 'Staff' ? 'צוות וחובות' : accountType === 'Other' ? 'אורחים וחובות' : 'תלמידים וחובות', {
        views: [{ rightToLeft: true }]
    })
    worksheet.columns = [
        { header: 'שם', key: 'name', width: 28 },
        ...(accountType === 'all' ? [{ header: 'סוג משתמש', key: 'accountTypeLabel', width: 18 }] : []),
        { header: 'כיתה', key: 'className', width: 16 },
        { header: 'יתרה (ש״ח)', key: 'balance', width: 16 },
        { header: 'חוב (ש״ח)', key: 'debt', width: 16 }
    ]
    worksheet.getRow(1).font = { bold: true }
    users.forEach((user) => {
        const balance = Math.round((Number(user.balance) || 0) * 100) / 100
        worksheet.addRow({
            name: user.name,
            accountTypeLabel: user.accountType === 'Staff' || (!user.accountType && user.roles === 'Admin') ? 'צוות' : user.accountType === 'Other' ? 'אורח' : 'תלמיד',
            className: user.className || '',
            balance,
            debt: balance < 0 ? Math.abs(balance) : 0
        })
    })
    worksheet.getColumn('balance').numFmt = '#,##0.00'
    worksheet.getColumn('debt').numFmt = '#,##0.00'

    const buffer = await workbook.xlsx.writeBuffer()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    const fileName = accountType === 'all' ? 'all-accounts-debts.xlsx' : accountType === 'Staff' ? 'staff-debts.xlsx' : accountType === 'Other' ? 'guest-debts.xlsx' : 'student-debts.xlsx'
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.send(Buffer.from(buffer))
}

module.exports = {
    previewImport,
    importStudents,
    exportStudents,
    parseStudentWorkbook,
    enrichWithDuplicateStatus,
    makePreview
}