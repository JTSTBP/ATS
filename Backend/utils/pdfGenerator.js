const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateInvoicePDF(invoice, payment, path) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        const stream = fs.createWriteStream(path);
        doc.pipe(stream);

        // Helper to format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount).replace('₹', '');
        };

        // Helper to convert number to words
        const numberToWords = (num) => {
            const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

            const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return; var str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
            return str;
        };

        // --- Header Section ---
        // Add Logo
        const logoPath = 'c:\\MyProjects\\OfficeProjects\\ATS\\Frontend\\src\\images\\logo.png';
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 100 });
        }

        doc.fontSize(10).text(`Invoice No. JT/RO/25-26/${invoice._id.toString().substr(-4)}`, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, { align: 'right' });

        doc.moveDown(4); // Increased moveDown to accommodate logo

        // "To" Address
        doc.fontSize(12).font('Helvetica').text('To,', 50);
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text(invoice.client.companyName, 50);

        if (invoice.client.companyInfo) {
            doc.fontSize(10).font('Helvetica').text(invoice.client.companyInfo, 50, doc.y, { width: 300, align: 'left' });
        }

        // SAC Code (Positioned absolutely to avoid overlap with address if it's long)
        doc.text('SAC Code: 998512', 400, 110, { align: 'right' });

        doc.moveDown(2);

        // --- Table Section ---
        const tableTop = 200; // Fixed top position for table to ensure consistency
        const itemCodeX = 50;
        const descriptionX = 100;
        const dojX = 260;
        const designationX = 330;
        const ctcX = 430;
        const amountX = 500;

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Sr. No.', itemCodeX, tableTop);
        doc.text('Name Of the Candidate', descriptionX, tableTop);
        doc.text('D.O.J', dojX, tableTop);
        doc.text('Designation', designationX, tableTop);
        doc.text('CTC', ctcX, tableTop);
        doc.text('Amount', amountX, tableTop);

        // Header Line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Table Row
        const rowTop = tableTop + 25;
        doc.font('Helvetica').fontSize(10);

        doc.text('1', itemCodeX, rowTop);

        // Candidate Name (Wrapped)
        doc.text(
            invoice.candidate?.dynamicFields?.candidateName || invoice.candidate?.dynamicFields?.Name || 'N/A',
            descriptionX,
            rowTop,
            { width: 150 }
        );

        doc.text(new Date().toLocaleDateString('en-GB'), dojX, rowTop); // DOJ

        // Designation (Wrapped)
        doc.text(
            invoice.candidate?.jobId?.title || 'N/A',
            designationX,
            rowTop,
            { width: 90 }
        );

        doc.text('N/A', ctcX, rowTop); // CTC
        doc.text(formatCurrency(invoice.amount), amountX, rowTop);

        // Row Line
        doc.moveTo(50, rowTop + 30).lineTo(550, rowTop + 30).stroke();

        // --- Totals Section ---
        const totalTop = rowTop + 45;
        const amount = invoice.amount || 0;
        const igst = amount * 0.18;
        const grandTotal = amount + igst;

        // Align totals to the right side
        const labelX = 350;
        const valueX = 500;

        doc.text('Total', labelX, totalTop, { align: 'right', width: 100 });
        doc.text(formatCurrency(amount), valueX, totalTop);

        doc.text('IGST @ 18%', labelX, totalTop + 15, { align: 'right', width: 100 });
        doc.text(formatCurrency(igst), valueX, totalTop + 15);

        doc.font('Helvetica-Bold');
        doc.text('Grand Total', labelX, totalTop + 35, { align: 'right', width: 100 });
        doc.text(formatCurrency(grandTotal), valueX, totalTop + 35);

        // Amount in Words
        doc.font('Helvetica').fontSize(10);
        doc.text(`Amount in words -- ${numberToWords(Math.round(grandTotal))}`, 50, totalTop + 60, { width: 500 });

        // --- Bank Details Section ---
        const bankTop = totalTop + 90;
        doc.font('Helvetica-Bold').text('Bank Details', 50, bankTop);
        doc.font('Helvetica');

        const bankDetails = [
            'Name : Jobs Territory',
            'Bank Name : HDFC Bank',
            'Account Number : 59207259123253',
            'Branch Name : Cambridge Road',
            'IFSC Code : HDFC0001298',
            'PAN : AOBPR6552H',
            'GST No : 29AOBPR6552H1ZL'
        ];

        let currentBankY = bankTop + 15;
        bankDetails.forEach(detail => {
            doc.text(detail, 50, currentBankY);
            currentBankY += 15;
        });

        // --- Footer Section ---
        const footerTop = 700;
        doc.fontSize(9).text('Note:', 50, footerTop);
        doc.text('Address: 15/45, Cambridge Road, halasuru, Bengaluru (Bangalore) Rural, Karnataka, 560008', 50, footerTop + 15, { width: 500 });
        doc.fillColor('blue').text('www.jobsterritory.com', 50, footerTop + 30, { link: 'http://www.jobsterritory.com', underline: true });
        doc.fillColor('black'); // Reset color

        doc.end();

        stream.on('finish', () => resolve(path));
        stream.on('error', (err) => reject(err));
    });
}

module.exports = { generateInvoicePDF };
