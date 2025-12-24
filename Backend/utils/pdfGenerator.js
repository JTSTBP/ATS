const PDFDocument = require('pdfkit');
const fs = require('fs');

function generateInvoicePDF(invoice, payment, path) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });

        const stream = fs.createWriteStream(path);
        doc.pipe(stream);

        // Helper to format currency
        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0).replace('₹', '');
        };

        // Helper to convert number to words
        const numberToWords = (num) => {
            const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
            const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

            const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n) return ''; var str = '';
            str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
            str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
            str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
            str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
            str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : '';
            return str || 'Zero Only';
        };

        // --- Header Section ---
        const logoPath = 'c:\\MyProjects\\OfficeProjects\\ATS\\Frontend\\src\\images\\logo.png';
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 50, 45, { width: 100 });
        }

        doc.fontSize(10).text(`Invoice No. JT/RO/25-26/${invoice._id.toString().substr(-4)}`, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`, { align: 'right' });

        doc.moveDown(4);

        // "To" Address
        doc.fontSize(12).font('Helvetica').text('To,', 50);
        doc.moveDown(0.5);
        doc.fontSize(14).font('Helvetica-Bold').text(invoice.client.companyName, 50);

        // Display address and state if available
        if (invoice.client.address || invoice.client.state) {
            let addressText = '';
            if (invoice.client.address) addressText += invoice.client.address;
            if (invoice.client.state) {
                if (addressText) addressText += ', ';
                addressText += invoice.client.state;
            }
            doc.fontSize(10).font('Helvetica').text(addressText, 50, doc.y, { width: 300, align: 'left' });
        } else if (invoice.client.companyInfo) {
            // Fallback to companyInfo if address is not available
            doc.fontSize(10).font('Helvetica').text(invoice.client.companyInfo, 50, doc.y, { width: 300, align: 'left' });
        }

        // Display client's GST Number if available
        const clientGst = invoice.gstNumber || invoice.client.gstNumber;
        if (clientGst) {
            doc.fontSize(10).font('Helvetica-Bold').text(`GST No: ${clientGst}`, 50);
        }

        doc.text('SAC Code: 998512', 400, 110, { align: 'right' });

        doc.moveDown(2);

        // --- Table Section ---
        const tableTop = 200;
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

        let currentY = tableTop + 25;
        let totalAmount = 0;

        invoice.candidates.forEach((c, index) => {
            doc.font('Helvetica').fontSize(10);
            doc.text((index + 1).toString(), itemCodeX, currentY);

            const candidateName = c.candidateId?.dynamicFields?.candidateName || c.candidateId?.dynamicFields?.Name || 'N/A';
            doc.text(candidateName, descriptionX, currentY, { width: 150 });

            const doj = c.doj ? new Date(c.doj).toLocaleDateString('en-GB') : 'N/A';
            doc.text(doj, dojX, currentY);

            const designation = c.designation || c.candidateId?.jobId?.title || 'N/A';
            doc.text(designation, designationX, currentY, { width: 90 });

            const ctc = c.ctc ? formatCurrency(c.ctc) : 'N/A';
            doc.text(ctc, ctcX, currentY);

            doc.font('Helvetica-Bold').text(formatCurrency(c.amount), amountX, currentY);

            totalAmount += (c.amount || 0);
            currentY += 30; // Adjust spacing based on content if needed
        });

        // Row Line
        doc.moveTo(50, currentY).lineTo(550, currentY).stroke();

        // --- Totals Section ---
        const totalTop = currentY + 15;
        const isKarnataka = invoice.client.state?.toLowerCase() === 'karnataka';
        let grandTotal = totalAmount;

        const labelX = 350;
        const valueX = 500;

        doc.font('Helvetica').text('Sub Total', labelX, totalTop, { align: 'right', width: 100 });
        doc.font('Helvetica-Bold').text(formatCurrency(totalAmount), valueX, totalTop);

        if (isKarnataka) {
            const cgst = Math.round(totalAmount * 0.09);
            const sgst = Math.round(totalAmount * 0.09);
            grandTotal = totalAmount + cgst + sgst;

            doc.font('Helvetica').text('CGST @ 9%', labelX, totalTop + 15, { align: 'right', width: 100 });
            doc.text(formatCurrency(cgst), valueX, totalTop + 15);

            doc.text('SGST @ 9%', labelX, totalTop + 30, { align: 'right', width: 100 });
            doc.text(formatCurrency(sgst), valueX, totalTop + 30);

            doc.moveTo(labelX + 20, totalTop + 45).lineTo(550, totalTop + 45).stroke();
            doc.font('Helvetica-Bold').fontSize(12).text('Grand Total', labelX, totalTop + 55, { align: 'right', width: 100 });
            doc.text(formatCurrency(grandTotal), valueX, totalTop + 55);
        } else {
            const igst = Math.round(totalAmount * 0.18);
            grandTotal = totalAmount + igst;

            doc.font('Helvetica').text('IGST @ 18%', labelX, totalTop + 15, { align: 'right', width: 100 });
            doc.text(formatCurrency(igst), valueX, totalTop + 15);

            doc.moveTo(labelX + 20, totalTop + 30).lineTo(550, totalTop + 30).stroke();
            doc.font('Helvetica-Bold').fontSize(12).text('Grand Total', labelX, totalTop + 40, { align: 'right', width: 100 });
            doc.text(formatCurrency(grandTotal), valueX, totalTop + 40);
        }

        // Amount in Words
        const amountInWordsY = isKarnataka ? totalTop + 85 : totalTop + 70;
        doc.font('Helvetica-Oblique').fontSize(10);
        doc.text(`Amount in words -- ${numberToWords(Math.round(grandTotal))}`, 50, amountInWordsY, { width: 500 });

        // --- Bank Details Section ---
        const bankTop = amountInWordsY + 40;
        doc.font('Helvetica-Bold').fontSize(11).text('Bank Details:', 50, bankTop);
        doc.font('Helvetica').fontSize(10);

        const bankDetails = [
            ['Account Name:', 'JT STRATEGIC BUSINESS PARTNER'],
            ['Bank:', 'ICICI BANK'],
            ['Account No:', '000205030235'],
            ['IFSC Code:', 'ICIC0000002'],
            ['Branch:', 'RPC LAYOUT']
        ];

        let currentBankY = bankTop + 18;
        bankDetails.forEach(([label, value]) => {
            doc.font('Helvetica-Bold').text(label, 50, currentBankY);
            doc.font('Helvetica').text(value, 130, currentBankY);
            currentBankY += 15;
        });

        // Computer generated note
        doc.fontSize(8).font('Helvetica-Oblique').text('Note: This is a computer generated invoice and does not require a physical signature unless specified.', 50, currentBankY + 10);

        // --- Signature Section ---
        const sigTop = bankTop + 18;
        doc.font('Helvetica-Bold').fontSize(10).text('For JT STRATEGIC BUSINESS PARTNER', 350, sigTop, { align: 'center', width: 200 });
        doc.moveTo(370, sigTop + 65).lineTo(530, sigTop + 65).stroke();
        doc.text('Authorised Signatory', 350, sigTop + 75, { align: 'center', width: 200 });

        doc.end();

        stream.on('finish', () => resolve(path));
        stream.on('error', (err) => reject(err));
    });
}

module.exports = { generateInvoicePDF };
