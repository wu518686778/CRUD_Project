/**
 * @preserve tableExport.jquery.plugin
 *
 * Version 1.33.0
 *
 * Copyright (c) 2015-2025 hhurz,
 *   https://github.com/hhurz/tableExport.jquery.plugin
 *
 * Based on https://github.com/kayalshri/tableExport.jquery.plugin
 *
 * Licensed under the MIT License
 **/

'use strict';

(function ($) {
  $.fn.tableExport = function (options) {
    let docData;
    const defaults = {
      csvEnclosure: '"',
      csvSeparator: ',',
      csvUseBOM: true,
      date: {
        html: 'dd/mm/yyyy'              // Date format used in html source. Supported placeholders: dd, mm, yy, yyyy and a arbitrary single separator character
      },                                
      displayTableName: false,          // Deprecated
      escape: false,                    // Deprecated
      exportHiddenCells: false,         // true = speed up export of large tables with hidden cells (hidden cells will be exported !)
      fileName: 'tableExport',          
      htmlContent: false,               
      htmlHyperlink: 'content',         // Export the 'content' or the 'href' link of <a> tags unless onCellHtmlHyperlink is not defined
      ignoreColumn: [],                 
      ignoreRow: [],                    
      jsonScope: 'all',                 // One of 'head', 'data', 'all'
      jspdf: {                          // jsPDF / jsPDF-AutoTable related options
        orientation: 'p',               
        unit: 'pt',                     
        format: 'a4',                   // One of jsPDF page formats or 'bestfit' for automatic paper format selection
        margins: {left: 20, right: 10, top: 10, bottom: 10},
        onDocCreated: null,
        autotable: {
          styles: {
            cellPadding: 2,
            rowHeight: 12,
            fontSize: 8,
            fillColor: 255,             // Color value or 'inherit' to use css background-color from html table
            textColor: 50,              // Color value or 'inherit' to use css color from html table
            fontStyle: 'normal',        // 'normal', 'bold', 'italic', 'bolditalic' or 'inherit' to use css font-weight and font-style from html table
            overflow: 'ellipsize',      // 'visible', 'hidden', 'ellipsize' or 'linebreak'
            halign: 'inherit',          // 'left', 'center', 'right' or 'inherit' to use css horizontal cell alignment from html table
            valign: 'middle'            // 'top', 'middle', or 'bottom'
          },                          
          headerStyles: {             
            fillColor: [52, 73, 94],  
            textColor: 255,           
            fontStyle: 'bold',        
            halign: 'inherit',          // 'left', 'center', 'right' or 'inherit' to use css horizontal header cell alignment from html table
            valign: 'middle'            // 'top', 'middle', or 'bottom'
          },                          
          alternateRowStyles: {       
            fillColor: 245            
          },                          
          tableExport: {              
            doc: null,                  // jsPDF doc object. If set, an already created doc object will be used to export to
            onAfterAutotable: null,
            onBeforeAutotable: null,
            onAutotableText: null,
            onTable: null,
            outputImages: true
          }
        }
      },
      mso: {                            // MS Excel and MS Word related options
        fileFormat: 'xlshtml',          // 'xlshtml' = Excel 2000 html format
                                        // 'xmlss' = XML Spreadsheet 2003 file format (XMLSS)
                                        // 'xlsx' = Excel 2007 Office Open XML format
        onMsoNumberFormat: null,        // Excel 2000 html format only. See readme.md for more information about msonumberformat
        pageFormat: 'a4',               // Page format used for page orientation
        pageOrientation: 'portrait',    // portrait, landscape (xlshtml format only)
        rtl: false,                     // true = Set worksheet option 'DisplayRightToLeft'
        styles: [],                     // E.g. ['border-bottom', 'border-top', 'border-left', 'border-right']
        worksheetName: '',
        xlsx: {                         // Specific Excel 2007 XML format settings:
          formatId: {                   // XLSX format (id) used to format excel cells. See readme.md: data-tableexport-xlsxformatid
            date: 14,                   // The default format id, or a format string (e.g. 'm/d/yy'), or a function(cell, row, col)
            numbers: 2,                 // The default Format id, or a format string (e.g. '\"T\"\ #0.00'), or a function(cell, row, col)
            currency: 164               // This id is used by "data-tableexport-xlsxformatid" to allow you to export a cell in currency format (see below)
          },
          format: {
            currency: '$#,##0.00;[Red]-$#,##0.00' // The format string to be used for the export for the currency format 
                                                  // Euro format: '#,##0.00 €;[Red](#,##0.00) €'
          },
          onHyperlink: null             // function($cell, row, col, href, content, hyperlink): Return what to export for hyperlinks
        }
      },
      numbers: {
        html: {
          decimalMark: '.',             // Decimal mark in html source
          thousandsSeparator: ','       // Thousands separator in html source
        },
        output: {                       // Set 'output: false' to keep number format of html source in resulting output
          decimalMark: '.',             // Decimal mark in resulting output
          thousandsSeparator: ','       // Thousands separator in resulting output
        }
      },
      onAfterSaveToFile: null,          // function(data, fileName)
      onBeforeSaveToFile: null,         // saveIt = function(data, fileName, type, charset, encoding): Return false to abort save process
      onCellData: null,                 // Text to export = function($cell, row, col, href, cellText, cellType)
      onCellHtmlData: null,             // Text to export = function($cell, row, col, htmlContent)
      onCellHtmlHyperlink: null,        // Text to export = function($cell, row, col, href, cellText)
      onIgnoreRow: null,                // ignoreRow = function($tr, row): Return true to prevent export of the row
      onTableExportBegin: null,         // function() - called when export starts
      onTableExportEnd: null,           // function() - called when export ends
      outputMode: 'file',               // 'file', 'string', 'base64' or 'window' (experimental)
      pdfmake: {
        enabled: false,                 // true: Use pdfmake as pdf producer instead of jspdf and jspdf-autotable
        docDefinition: {
          pageSize: 'A4',               // 4A0,2A0,A{0-10},B{0-10},C{0-10},RA{0-4},SRA{0-4},EXECUTIVE,FOLIO,LEGAL,LETTER,TABLOID
          pageOrientation: 'portrait',  // 'portrait' or 'landscape'
          styles: {
            header: {
              background: '#34495E',
              color: '#FFFFFF',
              bold: true,
              alignment: 'center',
              fillColor: '#34495E'
            },
            alternateRow: {
              fillColor: '#f5f5f5'
            }
          },
          defaultStyle: {
            color: '#000000',
            fontSize: 8,
            font: 'Roboto'              // Default font is 'Roboto' which needs vfs_fonts.js to be included
          }                             // To export arabic characters include mirza_fonts.js _instead_ of vfs_fonts.js
        },                              // For a chinese font include either gbsn00lp_fonts.js or ZCOOLXiaoWei_fonts.js _instead_ of vfs_fonts.js
        fonts: {},
        widths: '*',                    // '*' - divides the available width equally among all columns,
                                        // 'auto' - dynamically adjust the width of all columns based on the content,
                                        // [] - an array with different types of values according to the description for column widths of pdfmake
      },
      preserve: {
        leadingWS: false,               // preserve leading white spaces
        trailingWS: false               // preserve trailing white spaces
      },
      preventInjection: true,           // Prepend a single quote to cell strings that start with =,+,- or @ to prevent formula injection
      sql: {
        tableEnclosure: '`',            // If table name or column names contain any characters except letters, numbers, and
        columnEnclosure: '`'            // underscores, usually the name must be delimited by enclosing it in back quotes (`)
      },
      tbodySelector: 'tr',
      tfootSelector: 'tr',              // Set empty ('') to prevent export of tfoot rows
      theadSelector: 'tr',
      tableName: 'Table',
      type: 'csv'                       // Export format: 'csv', 'tsv', 'txt', 'markdown', 'sql', 'json', 'xml', 'excel', 'doc', 'png' or 'pdf'
    };

    const pageFormats = { // Size in pt of various paper formats. Adopted from jsPDF.
      'a0': [2383.94, 3370.39], 'a1': [1683.78, 2383.94], 'a2': [1190.55, 1683.78],
      'a3': [841.89, 1190.55], 'a4': [595.28, 841.89], 'a5': [419.53, 595.28],
      'a6': [297.64, 419.53], 'a7': [209.76, 297.64], 'a8': [147.40, 209.76],
      'a9': [104.88, 147.40], 'a10': [73.70, 104.88],
      'b0': [2834.65, 4008.19], 'b1': [2004.09, 2834.65], 'b2': [1417.32, 2004.09],
      'b3': [1000.63, 1417.32], 'b4': [708.66, 1000.63], 'b5': [498.90, 708.66],
      'b6': [354.33, 498.90], 'b7': [249.45, 354.33], 'b8': [175.75, 249.45],
      'b9': [124.72, 175.75], 'b10': [87.87, 124.72],
      'c0': [2599.37, 3676.54],
      'c1': [1836.85, 2599.37], 'c2': [1298.27, 1836.85], 'c3': [918.43, 1298.27],
      'c4': [649.13, 918.43], 'c5': [459.21, 649.13], 'c6': [323.15, 459.21],
      'c7': [229.61, 323.15], 'c8': [161.57, 229.61], 'c9': [113.39, 161.57],
      'c10': [79.37, 113.39],
      'dl': [311.81, 623.62],
      'letter': [612, 792], 'government-letter': [576, 756], 'legal': [612, 1008],
      'junior-legal': [576, 360], 'ledger': [1224, 792], 'tabloid': [792, 1224],
      'credit-card': [153, 243]
    };

    const jsPdfThemes = { // Styles for the themes
      'striped': {
        table: {
          fillColor: 255,
          textColor: 80,
          fontStyle: 'normal',
          fillStyle: 'F'
        },
        header: {
          textColor: 255,
          fillColor: [41, 128, 185],
          rowHeight: 23,
          fontStyle: 'bold'
        },
        body: {},
        alternateRow: {fillColor: 245}
      },
      'grid': {
        table: {
          fillColor: 255,
          textColor: 80,
          fontStyle: 'normal',
          lineWidth: 0.1,
          fillStyle: 'DF'
        },
        header: {
          textColor: 255,
          fillColor: [26, 188, 156],
          rowHeight: 23,
          fillStyle: 'F',
          fontStyle: 'bold'
        },
        body: {},
        alternateRow: {}
      },
      'plain': {header: {fontStyle: 'bold'}}
    };

    let jsPdfDefaultStyles = { // Base style for all themes
      cellPadding: 5,
      fontSize: 10,
      fontName: "helvetica",     // helvetica, times, courier, malgun
      lineColor: 200,
      lineWidth: 0.1,
      fontStyle: 'normal',       // normal, bold, italic, bolditalic
      overflow: 'ellipsize',     // visible, hidden, ellipsize or linebreak
      fillColor: 255,
      textColor: 20,
      halign: 'left',            // left, center, right
      valign: 'top',             // top, middle, bottom
      fillStyle: 'F',            // 'S', 'F' or 'DF' (stroke, fill or fill then stroke)
      rowHeight: 20,
      columnWidth: 'auto'
    };

    const FONT_ROW_RATIO = 1.15;
    const el = this;
    let DownloadEvt = null;
    let $head_rows = [];
    let $rows = [];
    let rowIndex = 0;
    let trData = '';
    let colNames = [];
    let ranges = [];
    let blob;
    let $hiddenTableElements = [];
    let checkCellVisibility = false;

    $.extend(true, defaults, options);

    // Adopt deprecated options
    if (defaults.type === 'xlsx') {
      defaults.mso.fileFormat = defaults.type;
      defaults.type = 'excel';
    }
    if (typeof defaults.excelFileFormat !== 'undefined' && typeof defaults.mso.fileFormat === 'undefined')
      defaults.mso.fileFormat = defaults.excelFileFormat;
    if (typeof defaults.excelPageFormat !== 'undefined' && typeof defaults.mso.pageFormat === 'undefined')
      defaults.mso.pageFormat = defaults.excelPageFormat;
    if (typeof defaults.excelPageOrientation !== 'undefined' && typeof defaults.mso.pageOrientation === 'undefined')
      defaults.mso.pageOrientation = defaults.excelPageOrientation;
    if (typeof defaults.excelRTL !== 'undefined' && typeof defaults.mso.rtl === 'undefined')
      defaults.mso.rtl = defaults.excelRTL;
    if (typeof defaults.excelstyles !== 'undefined' && typeof defaults.mso.styles === 'undefined')
      defaults.mso.styles = defaults.excelstyles;
    if (typeof defaults.onMsoNumberFormat !== 'undefined' && typeof defaults.mso.onMsoNumberFormat === 'undefined')
      defaults.mso.onMsoNumberFormat = defaults.onMsoNumberFormat;
    if (typeof defaults.worksheetName !== 'undefined' && typeof defaults.mso.worksheetName === 'undefined')
      defaults.mso.worksheetName = defaults.worksheetName;
    if (typeof defaults.mso.xslx !== 'undefined' && typeof defaults.mso.xlsx === 'undefined')
      defaults.mso.xlsx = defaults.mso.xslx;

    // Check values of some options
    defaults.mso.pageOrientation = (defaults.mso.pageOrientation.substr(0, 1) === 'l') ? 'landscape' : 'portrait';
    defaults.date.html = defaults.date.html || '';

    if (defaults.date.html.length) {
      const patt = [];
      patt['dd'] = '(3[01]|[12][0-9]|0?[1-9])';
      patt['mm'] = '(1[012]|0?[1-9])';
      patt['yyyy'] = '((?:1[6-9]|2[0-2])\\d{2})';
      patt['yy'] = '(\\d{2})';

      const separator = defaults.date.html.match(/[^a-zA-Z0-9]/)[0];
      const formatItems = defaults.date.html.toLowerCase().split(separator);
      defaults.date.regex = '^\\s*';
      defaults.date.regex += patt[formatItems[0]];
      defaults.date.regex += '(.)'; // separator group
      defaults.date.regex += patt[formatItems[1]];
      defaults.date.regex += '\\2'; // identical separator group
      defaults.date.regex += patt[formatItems[2]];
      defaults.date.regex += '\\s*$';
      // e.g. '^\\s*(3[01]|[12][0-9]|0?[1-9])(.)(1[012]|0?[1-9])\\2((?:1[6-9]|2[0-2])\\d{2})\\s*$'

      defaults.date.pattern = new RegExp(defaults.date.regex, 'g');
      let f = formatItems.indexOf('dd') + 1;
      defaults.date.match_d = f + (f > 1 ? 1 : 0);
      f = formatItems.indexOf('mm') + 1;
      defaults.date.match_m = f + (f > 1 ? 1 : 0);
      f = (formatItems.indexOf('yyyy') >= 0 ? formatItems.indexOf('yyyy') : formatItems.indexOf('yy')) + 1;
      defaults.date.match_y = f + (f > 1 ? 1 : 0);
    }

    colNames = GetColumnNames(el);

    if (typeof defaults.onTableExportBegin === 'function')
      defaults.onTableExportBegin();

    if (defaults.type === 'csv' || defaults.type === 'tsv' || defaults.type === 'txt') {

      let csvData = '';
      let rowLength = 0;
      ranges = [];
      rowIndex = 0;

      const csvString = function (cell, rowIndex, colIndex) {
        let result = '';

        if (cell !== null) {
          const dataString = parseString(cell, rowIndex, colIndex);

          const csvValue = (dataString === null || dataString === '') ? '' : dataString.toString();

          if (defaults.type === 'tsv') {
            if (dataString instanceof Date)
              dataString.toLocaleString();

            // According to http://www.iana.org/assignments/media-types/text/tab-separated-values
            // are fields that contain tabs not allowable in tsv encoding
            result = replaceAll(csvValue, '\t', ' ');
          } else {
            // Takes a string and encapsulates it (by default in double-quotes) if it
            // contains the csv field separator, spaces, or linebreaks.
            if (dataString instanceof Date)
              result = defaults.csvEnclosure + dataString.toLocaleString() + defaults.csvEnclosure;
            else {
              result = preventInjection(csvValue);
              result = replaceAll(result, defaults.csvEnclosure, defaults.csvEnclosure + defaults.csvEnclosure);

              if (result.indexOf(defaults.csvSeparator) >= 0 || /[\r\n ]/g.test(result))
                result = defaults.csvEnclosure + result + defaults.csvEnclosure;
            }
          }
        }

        return result;
      };

      const CollectCsvData = function ($rows, rowselector, length) {

        $rows.each(function () {
          trData = '';
          ForEachVisibleCell(this, rowselector, rowIndex, length + $rows.length,
              function (cell, row, col) {
                trData += csvString(cell, row, col) + (defaults.type === 'tsv' ? '\t' : defaults.csvSeparator);
              });
          trData = $.trim(trData).substring(0, trData.length - 1);
          if (trData.length > 0) {

            if (csvData.length > 0)
              csvData += '\n';

            csvData += trData;
          }
          rowIndex++;
        });

        return $rows.length;
      };

      rowLength += CollectCsvData($(el).find('thead').first().find(defaults.theadSelector), 'th,td', rowLength);
      findTableElements($(el), 'tbody').each(function () {
        rowLength += CollectCsvData(findTableElements($(this), defaults.tbodySelector), 'td,th', rowLength);
      });
      if (defaults.tfootSelector.length)
        CollectCsvData($(el).find('tfoot').first().find(defaults.tfootSelector), 'td,th', rowLength);

      csvData += '\n';

      //output
      if (defaults.outputMode === 'string')
        return csvData;

      if (defaults.outputMode === 'base64')
        return base64encode(csvData);

      if (defaults.outputMode === 'window') {
        downloadFile(false, 'data:text/' + (defaults.type === 'csv' ? 'csv' : 'plain') + ';charset=utf-8,', csvData);
        return;
      }

      saveToFile(csvData,
        defaults.fileName + '.' + defaults.type,
        'text/' + (defaults.type === 'csv' ? 'csv' : 'plain'),
        'utf-8',
        '',
        (defaults.type === 'csv' && defaults.csvUseBOM));

      } else if (defaults.type === 'markdown') {
        let markdownTable = '';
        const $head_rows = collectHeadRows($(el));
        const $rows = collectRows($(el));
    
        // Function to generate a single table in Markdown format
        function generateMarkdownTable($table) {
            let tableMarkdown = '';
            const $head_rows = collectHeadRows($table);
            const $rows = collectRows($table);
            const hasHeader = $head_rows.length > 0;
    
            // Header row (if present)
            let headerRow = '|';
            let separatorRow = '|';
            if (hasHeader) {
                $($head_rows).each(function () {
                    ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
                        function (cell, row, col) {
                            let cellText = parseString(cell, row, col);
                            // Handle special characters and <br>-tags
                            cellText = cellText
                                .replace(/\|/g, '\\|') 
                                .replace(/-/g, '\\-') 
                                .replace(/\*/g, '\\*')
                                .replace(/_/g, '\\_')
                                .replace(/\#/g, '\\#');
                            cellText = cellText.replace(/<br\s*\/?>/gi, ' ');
                            cellText = cellText.replace(/\r/g, '').replace(/\t/g, '    ').replace(/\n/g, ' ');
                            cellText = $.trim(cellText);
                            headerRow += ' ' + cellText + ' |';
                        });
                    rowIndex++;
                });
            } else {
                // Generate an "empty" header if no header rows are present
                const firstDataRow = $rows[0];
                if (firstDataRow) {
                    ForEachVisibleCell(firstDataRow, 'td', rowIndex, $rows.length,
                        function (cell, row, col) {
                            headerRow += ' ' + ' |';
                        });
                }
            }
    
            // Separator row
            separatorRow = '|';
            for (let i = 0; i < headerRow.split('|').length - 2; i++) {
                separatorRow += ' --- |'; // Standard separator line for Markdown tables
            }
    
            // Add header and separator to the table
            if (hasHeader || $rows.length > 0) {
                tableMarkdown += headerRow + '\n' + separatorRow + '\n';
            }
    
            // Data rows
            $($rows).each(function () {
                let dataRow = '|';
                ForEachVisibleCell(this, 'td', rowIndex, $rows.length,
                    function (cell, row, col) {
                        let cellText = parseString(cell, row, col);
                        cellText = cellText
                            .replace(/\|/g, '\\|')
                            .replace(/-/g, '\\-')
                            .replace(/\*/g, '\\*')
                            .replace(/_/g, '\\_')
                            .replace(/\#/g, '\\#');
                        cellText = cellText.replace(/<br\s*\/?>/gi, ' ');
                        cellText = cellText.replace(/\r/g, '').replace(/\t/g, '    ').replace(/\n/g, ' ');
                        cellText = $.trim(cellText);
                        dataRow += ' ' + cellText + ' |';
                    });
                if (dataRow !== '|') { // Check if the row is empty
                    tableMarkdown += dataRow + '\n';
                }
                rowIndex++;
            });
    
            return tableMarkdown;
        }
    
        // Export all tables and add a separator line
        $(el).filter(function () {
            return isVisible($(this));
        }).each(function () {
            const tableMarkdown = generateMarkdownTable($(this));
            markdownTable += tableMarkdown;
    
            // Add a separator line unless it's the last table
            if ($(el).index(this) < $(el).length - 1) {
                markdownTable += '\n\n'; // Two blank lines as a separator
            }
        });
    
        // Output
        if (defaults.outputMode === 'string')
            return markdownTable;
        if (defaults.outputMode === 'base64')
            return base64encode(markdownTable);
        saveToFile(markdownTable,
            defaults.fileName + '.md',
            'text/markdown',
            'utf-8',
            '',
            false);
    } else if (defaults.type === 'sql') {

      // Header
      rowIndex = 0;
      ranges = [];
      let tdData = 'INSERT INTO ' + defaults.sql.tableEnclosure + defaults.tableName + defaults.sql.tableEnclosure + ' (';
      $head_rows = collectHeadRows($(el));
      $($head_rows).each(function () {
        ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
          function (cell, row, col) {
            let colName = parseString(cell, row, col) || '';
            if (colName.indexOf(defaults.sql.columnEnclosure) > -1)
              colName = replaceAll(colName.toString(), defaults.sql.columnEnclosure, defaults.sql.columnEnclosure + defaults.sql.columnEnclosure);
            tdData += defaults.sql.columnEnclosure + colName + defaults.sql.columnEnclosure + ',';
          });
        rowIndex++;
        tdData = $.trim(tdData).substring(0, tdData.length - 1);
      });
      tdData += ') VALUES ';

      // Data
      $rows = collectRows($(el));
      $($rows).each(function () {
        trData = '';
        ForEachVisibleCell(this, 'td,th', rowIndex, $head_rows.length + $rows.length,
          function (cell, row, col) {
            let dataString = parseString(cell, row, col) || '';
            if (dataString.indexOf('\'') > -1)
              dataString = replaceAll(dataString.toString(), '\'', '\'\'');
            trData += '\'' + dataString + '\',';
          });
        if (trData.length > 3) {
          tdData += '(' + trData;
          tdData = $.trim(tdData).substring(0, tdData.length - 1);
          tdData += '),';
        }
        rowIndex++;
      });

      tdData = $.trim(tdData).substring(0, tdData.length - 1);
      tdData += ';';

      // Output
      if (defaults.outputMode === 'string')
        return tdData;

      if (defaults.outputMode === 'base64')
        return base64encode(tdData);

      saveToFile(tdData, defaults.fileName + '.sql', 'application/sql', 'utf-8', '', false);

    } else if (defaults.type === 'json') {
      const jsonHeaderArray = [];
      ranges = [];
      $head_rows = collectHeadRows($(el));
      $($head_rows).each(function () {
        const jsonArrayTd = [];

        ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
          function (cell, row, col) {
            jsonArrayTd.push(parseString(cell, row, col));
          });
        jsonHeaderArray.push(jsonArrayTd);
      });

      // Data
      const jsonArray = [];

      $rows = collectRows($(el));
      $($rows).each(function () {
        const jsonObjectTd = {};
        let colIndex = 0;

        ForEachVisibleCell(this, 'td,th', rowIndex, $head_rows.length + $rows.length,
          function (cell, row, col) {
            if (jsonHeaderArray.length) {
              jsonObjectTd[jsonHeaderArray[jsonHeaderArray.length - 1][colIndex]] = parseString(cell, row, col);
            } else {
              jsonObjectTd[colIndex] = parseString(cell, row, col);
            }
            colIndex++;
          });
        if ($.isEmptyObject(jsonObjectTd) === false)
          jsonArray.push(jsonObjectTd);

        rowIndex++;
      });

      let save_data;

      if (defaults.jsonScope === 'head')
        save_data = JSON.stringify(jsonHeaderArray);
      else if (defaults.jsonScope === 'data')
        save_data = JSON.stringify(jsonArray);
      else // all
        save_data = JSON.stringify({header: jsonHeaderArray, data: jsonArray});

      if (defaults.outputMode === 'string')
        return save_data;

      if (defaults.outputMode === 'base64')
        return base64encode(save_data);

      saveToFile(save_data, defaults.fileName + '.json', 'application/json', 'utf-8', 'base64', false);

    } else if (defaults.type === 'xml') {
      rowIndex = 0;
      ranges = [];
      let xml = '<?xml version="1.0" encoding="utf-8"?>';
      xml += '<tabledata><fields>';

      // Header
      $head_rows = collectHeadRows($(el));
      $($head_rows).each(function () {

        ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
          function (cell, row, col) {
            xml += '<field>' + parseString(cell, row, col) + '</field>';
          });
        rowIndex++;
      });
      xml += '</fields><data>';

      // Data
      let rowCount = 1;

      $rows = collectRows($(el));
      $($rows).each(function () {
        let colCount = 1;
        trData = '';
        ForEachVisibleCell(this, 'td,th', rowIndex, $head_rows.length + $rows.length,
          function (cell, row, col) {
            trData += '<column-' + colCount + '>' + parseString(cell, row, col) + '</column-' + colCount + '>';
            colCount++;
          });
        if (trData.length > 0 && trData !== '<column-1></column-1>') {
          xml += '<row id="' + rowCount + '">' + trData + '</row>';
          rowCount++;
        }

        rowIndex++;
      });
      xml += '</data></tabledata>';

      // Output
      if (defaults.outputMode === 'string')
        return xml;

      if (defaults.outputMode === 'base64')
        return base64encode(xml);

      saveToFile(xml, defaults.fileName + '.xml', 'application/xml', 'utf-8', 'base64', false);
    } else if (defaults.type === 'excel' && defaults.mso.fileFormat === 'xmlss') {
      const sheetData = [];
      const docNames = [];

      $(el).filter(function () {
        return isVisible($(this));
      }).each(function () {
        const $table = $(this);

        let ssName = '';
        if (typeof defaults.mso.worksheetName === 'string' && defaults.mso.worksheetName.length)
          ssName = defaults.mso.worksheetName + ' ' + (docNames.length + 1);
        else if (typeof defaults.mso.worksheetName[docNames.length] !== 'undefined')
          ssName = defaults.mso.worksheetName[docNames.length];
        if (!ssName.length)
          ssName = $table.find('caption').text() || '';
        if (!ssName.length)
          ssName = 'Table ' + (docNames.length + 1);
        ssName = $.trim(ssName.replace(/[\\\/[\]*:?'"]/g, '').substring(0, 31));

        docNames.push($('<div />').text(ssName).html());

        if (defaults.exportHiddenCells === false) {
          $hiddenTableElements = $table.find('tr, th, td').filter(':hidden');
          checkCellVisibility = $hiddenTableElements.length > 0;
        }

        rowIndex = 0;
        colNames = GetColumnNames(this);
        docData = '<Table>\r';

        function CollectXmlssData ($rows, rowselector, length) {
          const spans = [];

          $($rows).each(function () {
            let ssIndex = 0;
            let nCols = 0;
            trData = '';

            ForEachVisibleCell(this, 'td,th', rowIndex, length + $rows.length,
              function (cell, row, col) {
                if (cell !== null) {
                  let style = '';
                  let data = parseString(cell, row, col);
                  let type = 'String';

                  if (jQuery.isNumeric(data) !== false) {
                    type = 'Number';
                  } else {
                    const number = parsePercent(data);
                    if (number !== false) {
                      data = number;
                      type = 'Number';
                      style += ' ss:StyleID="pct1"';
                    }
                  }

                  if (type !== 'Number')
                    data = data.replace(/\n/g, '<br>');

                  let colspan = getColspan(cell);
                  let rowspan = getRowspan(cell);

                  // Skip spans
                  $.each(spans, function () {
                    const range = this;
                    if (rowIndex >= range.s.r && rowIndex <= range.e.r && nCols >= range.s.c && nCols <= range.e.c) {
                      for (let i = 0; i <= range.e.c - range.s.c; ++i) {
                        nCols++;
                        ssIndex++;
                      }
                    }
                  });

                  // Handle Row Span
                  if (rowspan || colspan) {
                    rowspan = rowspan || 1;
                    colspan = colspan || 1;
                    spans.push({
                      s: {r: rowIndex, c: nCols},
                      e: {r: rowIndex + rowspan - 1, c: nCols + colspan - 1}
                    });
                  }

                  // Handle Colspan
                  if (colspan > 1) {
                    style += ' ss:MergeAcross="' + (colspan - 1) + '"';
                    nCols += (colspan - 1);
                  }

                  if (rowspan > 1) {
                    style += ' ss:MergeDown="' + (rowspan - 1) + '" ss:StyleID="rsp1"';
                  }

                  if (ssIndex > 0) {
                    style += ' ss:Index="' + (nCols + 1) + '"';
                    ssIndex = 0;
                  }

                  trData += '<Cell' + style + '><Data ss:Type="' + type + '">' +
                    $('<div />').text(data).html() +
                    '</Data></Cell>\r';
                  nCols++;
                }
              });
            if (trData.length > 0)
              docData += '<Row ss:AutoFitHeight="0">\r' + trData + '</Row>\r';
            rowIndex++;
          });

          return $rows.length;
        }

        const rowLength = CollectXmlssData(collectHeadRows($table), 'th,td', 0);
        CollectXmlssData(collectRows($table), 'td,th', rowLength);

        docData += '</Table>\r';
        sheetData.push(docData);
      });

      const count = {};
      const firstOccurrences = {};
      let item, itemCount;
      for (let n = 0, c = docNames.length; n < c; n++) {
        item = docNames[n];
        itemCount = count[item];
        itemCount = count[item] = (itemCount == null ? 1 : itemCount + 1);

        if (itemCount === 2)
          docNames[firstOccurrences[item]] = docNames[firstOccurrences[item]].substring(0, 29) + '-1';
        if (count[item] > 1)
          docNames[n] = docNames[n].substring(0, 29) + '-' + count[item];
        else
          firstOccurrences[item] = n;
      }

      const CreationDate = new Date().toISOString();
      let xmlssDocFile = '<?xml version="1.0" encoding="UTF-8"?>\r' +
          '<?mso-application progid="Excel.Sheet"?>\r' +
          '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r' +
          ' xmlns:o="urn:schemas-microsoft-com:office:office"\r' +
          ' xmlns:x="urn:schemas-microsoft-com:office:excel"\r' +
          ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\r' +
          ' xmlns:html="http://www.w3.org/TR/REC-html40">\r' +
          '<DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">\r' +
          '  <Created>' + CreationDate + '</Created>\r' +
          '</DocumentProperties>\r' +
          '<OfficeDocumentSettings xmlns="urn:schemas-microsoft-com:office:office">\r' +
          '  <AllowPNG/>\r' +
          '</OfficeDocumentSettings>\r' +
          '<ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">\r' +
          '  <WindowHeight>9000</WindowHeight>\r' +
          '  <WindowWidth>13860</WindowWidth>\r' +
          '  <WindowTopX>0</WindowTopX>\r' +
          '  <WindowTopY>0</WindowTopY>\r' +
          '  <ProtectStructure>False</ProtectStructure>\r' +
          '  <ProtectWindows>False</ProtectWindows>\r' +
          '</ExcelWorkbook>\r' +
          '<Styles>\r' +
          '  <Style ss:ID="Default" ss:Name="Normal">\r' +
          '    <Alignment ss:Vertical="Bottom"/>\r' +
          '    <Borders/>\r' +
          '    <Font/>\r' +
          '    <Interior/>\r' +
          '    <NumberFormat/>\r' +
          '    <Protection/>\r' +
          '  </Style>\r' +
          '  <Style ss:ID="rsp1">\r' +
          '    <Alignment ss:Vertical="Center"/>\r' +
          '  </Style>\r' +
          '  <Style ss:ID="pct1">\r' +
          '    <NumberFormat ss:Format="Percent"/>\r' +
          '  </Style>\r' +
          '</Styles>\r';

      for (let j = 0; j < sheetData.length; j++) {
        xmlssDocFile += '<Worksheet ss:Name="' + docNames[j] + '" ss:RightToLeft="' + (defaults.mso.rtl ? '1' : '0') + '">\r' +
          sheetData[j];
        if (defaults.mso.rtl) {
          xmlssDocFile += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">\r' +
            '<DisplayRightToLeft/>\r' +
            '</WorksheetOptions>\r';
        } else
          xmlssDocFile += '<WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"/>\r';
        xmlssDocFile += '</Worksheet>\r';
      }

      xmlssDocFile += '</Workbook>\r';

      if (defaults.outputMode === 'string')
        return xmlssDocFile;

      if (defaults.outputMode === 'base64')
        return base64encode(xmlssDocFile);

      saveToFile(xmlssDocFile, defaults.fileName + '.xml', 'application/xml', 'utf-8', 'base64', false);
    } else if (defaults.type === 'excel' && defaults.mso.fileFormat === 'xlsx') {

      const sheetNames = [];
      const workbook = XLSX.utils.book_new();

      // Multiple worksheets and .xlsx file extension #202

      $(el).filter(function () {
        return isVisible($(this));
      }).each(function () {
        const $table = $(this);
        const ws = xlsxTableToSheet(this);

        let sheetName = '';
        if (typeof defaults.mso.worksheetName === 'string' && defaults.mso.worksheetName.length)
          sheetName = defaults.mso.worksheetName + ' ' + (sheetNames.length + 1);
        else if (typeof defaults.mso.worksheetName[sheetNames.length] !== 'undefined')
          sheetName = defaults.mso.worksheetName[sheetNames.length];
        if (!sheetName.length)
          sheetName = $table.find('caption').text() || '';
        if (!sheetName.length)
          sheetName = 'Table ' + (sheetNames.length + 1);
        sheetName = $.trim(sheetName.replace(/[\\\/[\]*:?'"]/g, '').substring(0, 31));

        sheetNames.push(sheetName);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      });

      // add worksheet to workbook
      const wbData = XLSX.write(workbook, {type: 'binary', bookType: defaults.mso.fileFormat, bookSST: false});

      saveToFile(xlsxWorkbookToArrayBuffer(wbData),
        defaults.fileName + '.' + defaults.mso.fileFormat,
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'UTF-8', '', false);
    } else if (defaults.type === 'excel' || defaults.type === 'xls' || defaults.type === 'word' || defaults.type === 'doc') {

      const MSDocType = (defaults.type === 'excel' || defaults.type === 'xls') ? 'excel' : 'word';
      const MSDocExt = (MSDocType === 'excel') ? 'xls' : 'doc';
      const MSDocSchema = 'xmlns:x="urn:schemas-microsoft-com:office:' + MSDocType + '"';
      docData = '';
      let docName = '';

      $(el).filter(function () {
        return isVisible($(this));
      }).each(function () {
        const $table = $(this);

        if (docName === '') {
          docName = defaults.mso.worksheetName || $table.find('caption').text() || 'Table';
          docName = $.trim(docName.replace(/[\\\/[\]*:?'"]/g, '').substring(0, 31));
        }

        if (defaults.exportHiddenCells === false) {
          $hiddenTableElements = $table.find('tr, th, td').filter(':hidden');
          checkCellVisibility = $hiddenTableElements.length > 0;
        }

        rowIndex = 0;
        ranges = [];
        colNames = GetColumnNames(this);

        // Header
        docData += '<table><thead>';
        $head_rows = collectHeadRows($table);
        $($head_rows).each(function () {
          const $row = $(this);
          const rowStyles = document.defaultView.getComputedStyle($row[0], null);
          trData = '';
          ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
            function (cell, row, col) {
              if (cell !== null) {
                let thStyle = '';

                trData += '<th';
                if (defaults.mso.styles.length) {
                  const cellStyles = document.defaultView.getComputedStyle(cell, null);

                  for (let cssStyle in defaults.mso.styles) {
                    const stylePropertyName = defaults.mso.styles[cssStyle];
                    let thCss = getStyle(cellStyles, stylePropertyName);
                    if (thCss === '')
                      thCss = getStyle(rowStyles, stylePropertyName);
                    if (thCss !== '' && thCss !== '0px none rgb(0, 0, 0)' && thCss !== 'rgba(0, 0, 0, 0)') {
                      thStyle += (thStyle === '') ? 'style="' : ';';
                      thStyle += stylePropertyName + ':' + thCss;
                    }
                  }
                }
                if (thStyle !== '')
                  trData += ' ' + thStyle + '"';

                const tdColspan = getColspan(cell);
                if (tdColspan > 0)
                  trData += ' colspan="' + tdColspan + '"';

                const tdRowspan = getRowspan(cell);
                if (tdRowspan > 0)
                  trData += ' rowspan="' + tdRowspan + '"';

                trData += '>' + parseString(cell, row, col) + '</th>';
              }
            });
          if (trData.length > 0)
            docData += '<tr>' + trData + '</tr>';
          rowIndex++;
        });
        docData += '</thead><tbody>';

        // Data
        $rows = collectRows($table);
        $($rows).each(function () {
          const $row = $(this);
          let cellStyles = null;
          let rowStyles = null;
          trData = '';
          ForEachVisibleCell(this, 'td,th', rowIndex, $head_rows.length + $rows.length,
            function (cell, row, col) {
              if (cell !== null) {
                let tdValue = parseString(cell, row, col);
                let tdStyle = '';
                let tdCss = $(cell).attr('data-tableexport-msonumberformat');

                if (typeof tdCss === 'undefined' && typeof defaults.mso.onMsoNumberFormat === 'function')
                  tdCss = defaults.mso.onMsoNumberFormat(cell, row, col);

                if (typeof tdCss !== 'undefined' && tdCss !== '')
                  tdStyle = 'style="mso-number-format:\'' + tdCss + '\'';

                if (defaults.mso.styles.length) {
                  cellStyles = document.defaultView.getComputedStyle(cell, null);
                  rowStyles = null;

                  for (let cssStyle in defaults.mso.styles) {
                    const stylePropertyName = defaults.mso.styles[cssStyle];
                    tdCss = getStyle(cellStyles, stylePropertyName);

                    if (tdCss === '') {
                      if (rowStyles === null)
                        rowStyles = document.defaultView.getComputedStyle($row[0], null);
                      tdCss = getStyle(rowStyles, stylePropertyName);
                    }
                    if (tdCss !== '' && tdCss !== '0px none rgb(0, 0, 0)' && tdCss !== 'rgba(0, 0, 0, 0)') {
                      tdStyle += (tdStyle === '') ? 'style="' : ';';
                      tdStyle += stylePropertyName + ':' + tdCss;
                    }
                  }
                }

                trData += '<td';
                if (tdStyle !== '')
                  trData += ' ' + tdStyle + '"';

                const tdColspan = getColspan(cell);
                if (tdColspan > 0)
                  trData += ' colspan="' + tdColspan + '"';

                const tdRowspan = getRowspan(cell);
                if (tdRowspan > 0)
                  trData += ' rowspan="' + tdRowspan + '"';

                if (typeof tdValue === 'string' && tdValue !== '') {
                  tdValue = preventInjection(tdValue);
                  tdValue = tdValue.replace(/\n/g, '<br>');
                }

                trData += '>' + tdValue + '</td>';
              }
            });
          if (trData.length > 0)
            docData += '<tr>' + trData + '</tr>';
          rowIndex++;
        });

        if (defaults.displayTableName)
          docData += '<tr><td></td></tr><tr><td></td></tr><tr><td>' + parseString($('<p>' + defaults.tableName + '</p>')) + '</td></tr>';

        docData += '</tbody></table>';
      });

      //noinspection XmlUnusedNamespaceDeclaration
      let docFile = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' + MSDocSchema + ' xmlns="http://www.w3.org/TR/REC-html40">';
      docFile += '<head>';
      docFile += '<meta http-equiv="content-type" content="application/vnd.ms-' + MSDocType + '; charset=UTF-8">';
      if (MSDocType === 'excel') {
        docFile += '<!--[if gte mso 9]>';
        docFile += '<xml>';
        docFile += '<x:ExcelWorkbook>';
        docFile += '<x:ExcelWorksheets>';
        docFile += '<x:ExcelWorksheet>';
        docFile += '<x:Name>';
        docFile += docName;
        docFile += '</x:Name>';
        docFile += '<x:WorksheetOptions>';
        docFile += '<x:DisplayGridlines/>';
        if (defaults.mso.rtl)
          docFile += '<x:DisplayRightToLeft/>';
        docFile += '</x:WorksheetOptions>';
        docFile += '</x:ExcelWorksheet>';
        docFile += '</x:ExcelWorksheets>';
        docFile += '</x:ExcelWorkbook>';
        docFile += '</xml>';
        docFile += '<![endif]-->';
      }
      docFile += '<style>';

      docFile += '@page { size:' + defaults.mso.pageOrientation + '; mso-page-orientation:' + defaults.mso.pageOrientation + '; }';
      docFile += '@page Section1 {size:' + pageFormats[defaults.mso.pageFormat][0] + 'pt ' + pageFormats[defaults.mso.pageFormat][1] + 'pt';
      docFile += '; margin:1.0in 1.25in 1.0in 1.25in;mso-header-margin:.5in;mso-footer-margin:.5in;mso-paper-source:0;}';
      docFile += 'div.Section1 {page:Section1;}';
      docFile += '@page Section2 {size:' + pageFormats[defaults.mso.pageFormat][1] + 'pt ' + pageFormats[defaults.mso.pageFormat][0] + 'pt';
      docFile += ';mso-page-orientation:' + defaults.mso.pageOrientation + ';margin:1.25in 1.0in 1.25in 1.0in;mso-header-margin:.5in;mso-footer-margin:.5in;mso-paper-source:0;}';
      docFile += 'div.Section2 {page:Section2;}';

      docFile += 'br {mso-data-placement:same-cell;}';
      docFile += '</style>';
      docFile += '</head>';
      docFile += '<body>';
      docFile += '<div class="Section' + ((defaults.mso.pageOrientation === 'landscape') ? '2' : '1') + '">';
      docFile += docData;
      docFile += '</div>';
      docFile += '</body>';
      docFile += '</html>';

      if (defaults.outputMode === 'string')
        return docFile;

      if (defaults.outputMode === 'base64')
        return base64encode(docFile);

      saveToFile(docFile, defaults.fileName + '.' + MSDocExt, 'application/vnd.ms-' + MSDocType, '', 'base64', false);
    } else if (defaults.type === 'png') {
      html2canvas($(el)[0]).then(
        function (canvas) {

          const image = canvas.toDataURL();
          const byteString = atob(image.substring(22)); // remove data stuff
          const buffer = new ArrayBuffer(byteString.length);
          const intArray = new Uint8Array(buffer);

          for (let i = 0; i < byteString.length; i++)
            intArray[i] = byteString.charCodeAt(i);

          if (defaults.outputMode === 'string')
            return byteString;

          if (defaults.outputMode === 'base64')
            return base64encode(image);

          if (defaults.outputMode === 'window') {
            window.open(image);
            return;
          }

          saveToFile(buffer, defaults.fileName + '.png', 'image/png', '', '', false);
        });

    } else if (defaults.type === 'pdf') {

      if (defaults.pdfmake.enabled === true) {
        // pdf output using pdfmake
        // https://github.com/bpampuch/pdfmake

        const docDefinition = {
          content: []
        };

        $.extend(true, docDefinition, defaults.pdfmake.docDefinition);

        ranges = [];

        $(el).filter(function () {
          return isVisible($(this));
        }).each(function (tableIndex) {
          const $table = $(this);

          let widths = [];
          let colWidth = '*';
          const body = [];
          rowIndex = 0;

          if (typeof defaults.pdfmake.widths === 'string' && (defaults.pdfmake.widths.trim() === '*' || defaults.pdfmake.widths.trim() === 'auto')) {
            colWidth = defaults.pdfmake.widths.trim();
          } else if (Array.isArray(defaults.pdfmake.widths)) {
            widths = defaults.pdfmake.widths;
          }

          /**
           * @return {number}
           */
          const CollectPdfmakeData = function ($rows, colselector, length) {
            let rLength = 0;

            $($rows).each(function () {
              const r = [];

              ForEachVisibleCell(this, colselector, rowIndex, length,
                  function (cell, row, col) {
                    let cellContent;

                    if (typeof cell !== 'undefined' && cell !== null) {
                      const cs = getCellStyles(cell);
                      const clamp = function(val) {return Math.min(255, Math.max(0, val)); };
                      const toHex = function(val) {
                        const hex = clamp(val).toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                      };

                      cellContent = {
                        text: parseString(cell, row, col) || ' ',
                        alignment: cs.style.align,
                        backgroundColor: '#' + toHex(cs.style.bcolor[0]) + toHex(cs.style.bcolor[1]) + toHex(cs.style.bcolor[2]),
                        color: '#' + toHex(cs.style.color[0]) + toHex(cs.style.color[1]) + toHex(cs.style.color[2])
                      };

                      if (cs.style.fstyle.includes('italic'))
                        cellContent['fontStyle'] = 'italic';

                      if (cs.style.fstyle.includes('bold'))
                        cellContent['bold'] = true;

                      if (cs.colspan > 1 || cs.rowspan > 1) {
                        cellContent['colSpan'] = cs.colspan || 1;
                        cellContent['rowSpan'] = cs.rowspan || 1;
                      }
                    } else
                      cellContent = {text: ' '};

                    if (colselector.indexOf('th') >= 0)
                      cellContent['style'] = 'header';

                    r.push(cellContent);
                  });

              if (r.length)
                body.push(r);

              if (rLength < r.length)
                rLength = r.length;

              rowIndex++;
            });

            return rLength;
          };

          $head_rows = collectHeadRows($table);
          let head_colcount = CollectPdfmakeData($head_rows, 'th,td', $head_rows.length);

          // Data
          $rows = collectRows($table);
          let body_colcount = CollectPdfmakeData($rows, 'td', $head_rows.length + $rows.length);

          let colcount = head_colcount > body_colcount ? head_colcount : body_colcount;
          for (let i = widths.length; i < colcount; i++)
            widths.push(colWidth);

          docDefinition.content.push({ table: {
                                          headerRows: $head_rows.length ? $head_rows.length : null,
                                          widths: widths,
                                          body: body
                                        },
                                        layout: {
                                          layout: 'noBorders',
                                          hLineStyle: function (i, node) { return 0; },
                                          vLineWidth: function (i, node) { return 0; },
                                          hLineColor: function (i, node) { return i < node.table.headerRows ?
                                                        defaults.pdfmake.docDefinition.styles.header.background :
                                                        defaults.pdfmake.docDefinition.styles.alternateRow.fillColor; },
                                          vLineColor: function (i, node) { return i < node.table.headerRows ?
                                                        defaults.pdfmake.docDefinition.styles.header.background :
                                                        defaults.pdfmake.docDefinition.styles.alternateRow.fillColor; },
                                          fillColor: function (rowIndex, node, columnIndex) { return (rowIndex % 2 === 0) ?
                                                        defaults.pdfmake.docDefinition.styles.alternateRow.fillColor :
                                                        null; }
                                        },
                                        pageBreak: tableIndex > 0 ? "before" : undefined
                                     });
        }); // ...for each table

        if (typeof pdfMake !== 'undefined' && typeof pdfMake.createPdf !== 'undefined') {

          pdfMake.fonts = {
            Roboto: {
              normal: 'Roboto-Regular.ttf',
              bold: 'Roboto-Medium.ttf',
              italics: 'Roboto-Italic.ttf',
              bolditalics: 'Roboto-MediumItalic.ttf'
            }
          };

          // pdfmake >= 0.2.0 - replace pdfMake.vfs with pdfMake.virtualfs

          if (pdfMake.vfs.hasOwnProperty ('Mirza-Regular.ttf')) {
            docDefinition.defaultStyle.font = 'Mirza';
            $.extend(true, pdfMake.fonts, {Mirza: {normal:      'Mirza-Regular.ttf',
                                                   bold:        'Mirza-Bold.ttf',
                                                   italics:     'Mirza-Medium.ttf',
                                                   bolditalics: 'Mirza-SemiBold.ttf'
                                                   }});
          }
          else if (pdfMake.vfs.hasOwnProperty ('gbsn00lp.ttf')) {
            docDefinition.defaultStyle.font = 'gbsn00lp';
            $.extend(true, pdfMake.fonts, {gbsn00lp: {normal:      'gbsn00lp.ttf',
                                                      bold:        'gbsn00lp.ttf',
                                                      italics:     'gbsn00lp.ttf',
                                                      bolditalics: 'gbsn00lp.ttf'
                                                      }});
          }
          else if (pdfMake.vfs.hasOwnProperty ('ZCOOLXiaoWei-Regular.ttf')) {
            docDefinition.defaultStyle.font = 'ZCOOLXiaoWei';
            $.extend(true, pdfMake.fonts, {ZCOOLXiaoWei: {normal:      'ZCOOLXiaoWei-Regular.ttf',
                                                          bold:        'ZCOOLXiaoWei-Regular.ttf',
                                                          italics:     'ZCOOLXiaoWei-Regular.ttf',
                                                          bolditalics: 'ZCOOLXiaoWei-Regular.ttf'
                                                          }});
          }

          $.extend(true, pdfMake.fonts, defaults.pdfmake.fonts);

          // pdfmake <= 0.1.71
          pdfMake.createPdf(docDefinition).getBuffer(function (buffer) {
            saveToFile(buffer, defaults.fileName + '.pdf', 'application/pdf', '', '', false);
          });

          // pdfmake >= 0.2.0 - replace above code with:
          //pdfMake.createPdf(docDefinition).download(defaults.fileName);
        }
      } else if (defaults.jspdf.autotable === false) {
        // pdf output using jsPDF's core html support

        let doc = new jspdf.jsPDF({orientation: defaults.jspdf.orientation,
                                   unit: defaults.jspdf.unit,
                                   format: defaults.jspdf.format});
        doc.html(el[0], {
          callback: function () {
            jsPdfOutput(doc, false);
          },
          html2canvas: {scale: ((doc.internal.pageSize.width - defaults.jspdf.margins.left * 2) / el[0].scrollWidth)},
          x: defaults.jspdf.margins.left,
          y: defaults.jspdf.margins.top
          /*
          margin: [
            defaults.jspdf.margins.left,
            defaults.jspdf.margins.top,
            getPropertyUnitValue($(el).first().get(0), 'width', 'mm'),
            getPropertyUnitValue($(el).first().get(0), 'height', 'mm')
          ]
          */
        });
      } else {
        // pdf output using jsPDF AutoTable plugin
        // https://github.com/simonbengtsson/jsPDF-AutoTable

        let teOptions = defaults.jspdf.autotable.tableExport;

        // When setting jspdf.format to 'bestfit' tableExport tries to choose
        // the minimum required paper format and orientation in which the table
        // (or tables in multitable mode) completely fits without column adjustment
        if (typeof defaults.jspdf.format === 'string' && defaults.jspdf.format.toLowerCase() === 'bestfit') {
          let rk = '', ro = '';
          let mw = 0;

          $(el).each(function () {
            if (isVisible($(this))) {
              const w = getPropertyUnitValue($(this).get(0), 'width', 'pt');

              if (w > mw) {
                if (w > pageFormats.a0[0]) {
                  rk = 'a0';
                  ro = 'l';
                }
                for (let key in pageFormats) {
                  if (pageFormats.hasOwnProperty(key)) {
                    if (pageFormats[key][1] > w) {
                      rk = key;
                      ro = 'l';
                      if (pageFormats[key][0] > w)
                        ro = 'p';
                    }
                  }
                }
                mw = w;
              }
            }
          });
          defaults.jspdf.format = (rk === '' ? 'a4' : rk);
          defaults.jspdf.orientation = (ro === '' ? 'w' : ro);
        }

        // The jsPDF doc object is stored in defaults.jspdf.autotable.tableExport,
        // thus it can be accessed from any callback function
        if (teOptions.doc == null) {
          teOptions.doc = new jspdf.jsPDF(defaults.jspdf.orientation,
                                          defaults.jspdf.unit,
                                          defaults.jspdf.format);
          teOptions.wScaleFactor = 1;
          teOptions.hScaleFactor = 1;

          if (typeof defaults.jspdf.onDocCreated === 'function')
            defaults.jspdf.onDocCreated(teOptions.doc);
        }

        jsPdfDefaultStyles.fontName = teOptions.doc.getFont().fontName;

        if (teOptions.outputImages === true)
          teOptions.images = {};

        if (typeof teOptions.images !== 'undefined') {
          $(el).filter(function () {
            return isVisible($(this));
          }).each(function () {
            let rowCount = 0;
            ranges = [];

            if (defaults.exportHiddenCells === false) {
              $hiddenTableElements = $(this).find('tr, th, td').filter(':hidden');
              checkCellVisibility = $hiddenTableElements.length > 0;
            }

            $head_rows = collectHeadRows($(this));
            $rows = collectRows($(this));

            $($rows).each(function () {
              ForEachVisibleCell(this, 'td,th', $head_rows.length + rowCount, $head_rows.length + $rows.length,
                function (cell) {
                  collectImages(cell, $(cell).children(), teOptions);
                });
              rowCount++;
            });
          });

          $head_rows = [];
          $rows = [];
        }

        loadImages(teOptions, function () {
          $(el).filter(function () {
            return isVisible($(this));
          }).each(function () {
            let colKey;
            rowIndex = 0;
            ranges = [];

            if (defaults.exportHiddenCells === false) {
              $hiddenTableElements = $(this).find('tr, th, td').filter(':hidden');
              checkCellVisibility = $hiddenTableElements.length > 0;
            }

            colNames = GetColumnNames(this);

            teOptions.columns = [];
            teOptions.rows = [];
            teOptions.teCells = {};

            // onTable: optional callback function for every matching table that can be used
            // to modify the tableExport options or to skip the output of a particular table
            // if the table selector targets multiple tables
            if (typeof teOptions.onTable === 'function')
              if (teOptions.onTable($(this), defaults) === false)
                return true; // continue to next iteration step (table)

            // each table works with an own copy of AutoTable options
            defaults.jspdf.autotable.tableExport = null;  // avoid deep recursion error
            const atOptions = $.extend(true, {}, defaults.jspdf.autotable);
            defaults.jspdf.autotable.tableExport = teOptions;

            atOptions.margin = {};
            $.extend(true, atOptions.margin, defaults.jspdf.margins);
            atOptions.tableExport = teOptions;

            if (typeof atOptions.createdHeaderCell !== 'function') {
              // apply some original css styles to pdf header cells
              atOptions.createdHeaderCell = function (cell, data) {

                if (typeof teOptions.columns [data.column.dataKey] !== 'undefined') {
                  const col = teOptions.columns [data.column.dataKey];

                  if (typeof col.rect !== 'undefined') {
                    let rh;

                    cell.contentWidth = col.rect.width;

                    if (typeof teOptions.heightRatio === 'undefined' || teOptions.heightRatio === 0) {
                      if (data.row.raw [data.column.dataKey].rowspan)
                        rh = data.row.raw [data.column.dataKey].rect.height / data.row.raw [data.column.dataKey].rowspan;
                      else
                        rh = data.row.raw [data.column.dataKey].rect.height;

                      teOptions.heightRatio = cell.styles.rowHeight / rh;
                    }

                    rh = data.row.raw [data.column.dataKey].rect.height * teOptions.heightRatio;
                    if (rh > cell.styles.rowHeight)
                      cell.styles.rowHeight = rh;
                  }

                  cell.styles.halign = (atOptions.headerStyles.halign === 'inherit') ? 'center' : atOptions.headerStyles.halign;
                  cell.styles.valign = atOptions.headerStyles.valign;

                  if (typeof col.style !== 'undefined' && col.style.hidden !== true) {
                    if (atOptions.headerStyles.halign === 'inherit')
                      cell.styles.halign = col.style.align;
                    if (atOptions.styles.fillColor === 'inherit')
                      cell.styles.fillColor = col.style.bcolor;
                    if (atOptions.styles.textColor === 'inherit')
                      cell.styles.textColor = col.style.color;
                    if (atOptions.styles.fontStyle === 'inherit')
                      cell.styles.fontStyle = col.style.fstyle;
                  }
                }
              };
            }

            if (typeof atOptions.createdCell !== 'function') {
              // apply some original css styles to pdf table cells
              atOptions.createdCell = function (cell, data) {
                const tecell = teOptions.teCells [data.row.index + ':' + data.column.dataKey];

                cell.styles.halign = (atOptions.styles.halign === 'inherit') ? 'center' : atOptions.styles.halign;
                cell.styles.valign = atOptions.styles.valign;

                if (typeof tecell !== 'undefined' && typeof tecell.style !== 'undefined' && tecell.style.hidden !== true) {
                  if (atOptions.styles.halign === 'inherit')
                    cell.styles.halign = tecell.style.align;
                  if (atOptions.styles.fillColor === 'inherit')
                    cell.styles.fillColor = tecell.style.bcolor;
                  if (atOptions.styles.textColor === 'inherit')
                    cell.styles.textColor = tecell.style.color;
                  if (atOptions.styles.fontStyle === 'inherit')
                    cell.styles.fontStyle = tecell.style.fstyle;
                }
              };
            }

            if (typeof atOptions.drawHeaderCell !== 'function') {
              atOptions.drawHeaderCell = function (cell, data) {
                const colopt = teOptions.columns [data.column.dataKey];

                if ((colopt.style.hasOwnProperty('hidden') !== true || colopt.style.hidden !== true) &&
                  colopt.rowIndex >= 0)
                  return prepareAutoTableText(cell, data, colopt);
                else
                  return false; // cell is hidden
              };
            }

            if (typeof atOptions.drawCell !== 'function') {
              atOptions.drawCell = function (cell, data) {
                const teCell = teOptions.teCells [data.row.index + ':' + data.column.dataKey];
                const draw2canvas = (typeof teCell !== 'undefined' && teCell.isCanvas);

                if (draw2canvas !== true) {
                  if (prepareAutoTableText(cell, data, teCell)) {

                    teOptions.doc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);

                    if (typeof teCell !== 'undefined' &&
                        (typeof teCell.hasUserDefText === 'undefined' || teCell.hasUserDefText !== true) &&
                        typeof teCell.elements !== 'undefined' && teCell.elements.length) {

                      const hScale = cell.height / teCell.rect.height;
                      if (hScale > teOptions.hScaleFactor)
                        teOptions.hScaleFactor = hScale;
                      teOptions.wScaleFactor = cell.width / teCell.rect.width;

                      const ySave = cell.textPos.y;
                      drawAutotableElements(cell, teCell.elements, teOptions);
                      cell.textPos.y = ySave;

                      drawAutotableText(cell, teCell.elements, teOptions);
                    } else
                      drawAutotableText(cell, {}, teOptions);
                  }
                } else {
                  const container = teCell.elements[0];
                  const imgId = $(container).attr('data-tableexport-canvas');
                  const r = container.getBoundingClientRect();

                  cell.width = r.width * teOptions.wScaleFactor;
                  cell.height = r.height * teOptions.hScaleFactor;
                  data.row.height = cell.height;

                  jsPdfDrawImage(cell, container, imgId, teOptions);
                }
                return false;
              };
            }

            // collect header and data rows
            teOptions.headerrows = [];
            $head_rows = collectHeadRows($(this));
            $($head_rows).each(function () {
              colKey = 0;
              teOptions.headerrows[rowIndex] = [];

              ForEachVisibleCell(this, 'th,td', rowIndex, $head_rows.length,
                function (cell, row, col) {
                  const obj = getCellStyles(cell);
                  obj.title = parseString(cell, row, col);
                  obj.key = colKey++;
                  obj.rowIndex = rowIndex;
                  teOptions.headerrows[rowIndex].push(obj);
                });
              rowIndex++;
            });

            if (rowIndex > 0) {
              // iterate through last row
              let lastrow = rowIndex - 1;
              while (lastrow >= 0) {
                $.each(teOptions.headerrows[lastrow], function () {
                  let obj = this;

                  if (lastrow > 0 && this.rect === null)
                    obj = teOptions.headerrows[lastrow - 1][this.key];

                  if (obj !== null && obj.rowIndex >= 0 &&
                    (obj.style.hasOwnProperty('hidden') !== true || obj.style.hidden !== true))
                    teOptions.columns.push(obj);
                });

                lastrow = (teOptions.columns.length > 0) ? -1 : lastrow - 1;
              }
            }

            let rowCount = 0;
            $rows = [];
            $rows = collectRows($(this));
            $($rows).each(function () {
              const rowData = [];
              colKey = 0;

              ForEachVisibleCell(this, 'td,th', rowIndex, $head_rows.length + $rows.length,
                function (cell, row, col) {
                  let obj;

                  if (typeof teOptions.columns[colKey] === 'undefined') {
                    // jsPDF-Autotable needs columns. Thus define hidden ones for tables without thead
                    obj = {
                      title: '',
                      key: colKey,
                      style: {
                        hidden: true
                      }
                    };
                    teOptions.columns.push(obj);
                  }

                  rowData.push(parseString(cell, row, col));

                  if (typeof cell !== 'undefined' && cell !== null) {
                    obj = getCellStyles(cell);
                    obj.isCanvas = cell.hasAttribute('data-tableexport-canvas');
                    obj.elements = obj.isCanvas ? $(cell) : $(cell).children();

                    if(typeof $(cell).data('teUserDefText') !== 'undefined')
                      obj.hasUserDefText = true;

                    teOptions.teCells [rowCount + ':' + colKey++] = obj;
                  } else {
                    obj = $.extend(true, {}, teOptions.teCells [rowCount + ':' + (colKey - 1)]);
                    obj.colspan = -1;
                    teOptions.teCells [rowCount + ':' + colKey++] = obj;
                  }
                });
              if (rowData.length) {
                teOptions.rows.push(rowData);
                rowCount++;
              }
              rowIndex++;
            });

            // onBeforeAutotable: optional callback function before calling
            // jsPDF AutoTable that can be used to modify the AutoTable options
            if (typeof teOptions.onBeforeAutotable === 'function')
              teOptions.onBeforeAutotable($(this), teOptions.columns, teOptions.rows, atOptions);

            jsPdfAutoTable(atOptions.tableExport.doc, teOptions.columns, teOptions.rows, atOptions);

            // onAfterAutotable: optional callback function after returning
            // from jsPDF AutoTable that can be used to modify the AutoTable options
            if (typeof teOptions.onAfterAutotable === 'function')
              teOptions.onAfterAutotable($(this), atOptions);

            // set the start position for the next table (in case there is one)
            defaults.jspdf.autotable.startY = jsPdfAutoTableEndPosY() + atOptions.margin.top;

          });

          jsPdfOutput(teOptions.doc, (typeof teOptions.images !== 'undefined' && jQuery.isEmptyObject(teOptions.images) === false));

          if (typeof teOptions.headerrows !== 'undefined')
            teOptions.headerrows.length = 0;
          if (typeof teOptions.columns !== 'undefined')
            teOptions.columns.length = 0;
          if (typeof teOptions.rows !== 'undefined')
            teOptions.rows.length = 0;
          delete teOptions.doc;
          teOptions.doc = null;
        });
      }
    }

    function collectHeadRows ($table) {
      const result = [];
      findTableElements($table, 'thead').each(function () {
        result.push.apply(result, findTableElements($(this), defaults.theadSelector).toArray());
      });
      return result;
    }

    function collectRows ($table) {
      const result = [];
      findTableElements($table, 'tbody').each(function () {
        result.push.apply(result, findTableElements($(this), defaults.tbodySelector).toArray());
      });
      if (defaults.tfootSelector.length) {
        findTableElements($table, 'tfoot').each(function () {
          result.push.apply(result, findTableElements($(this), defaults.tfootSelector).toArray());
        });
      }
      return result;
    }

    function findTableElements ($parent, selector) {
      const parentSelector = $parent[0].tagName;
      const parentLevel = $parent.parents(parentSelector).length;
      return $parent.find(selector).filter(function () {
        return parentLevel === $(this).closest(parentSelector).parents(parentSelector).length;
      });
    }

    function GetColumnNames (table) {
      const result = [];
      let maxCols = 0;
      let row = 0;
      let col = 0;
      $(table).find('thead').first().find('th').each(function (index, el) {
        const hasDataField = $(el).attr('data-field') !== undefined;
        if (typeof el.parentNode.rowIndex !== 'undefined' && row !== el.parentNode.rowIndex) {
          row = el.parentNode.rowIndex;
          col = 0;
          maxCols = 0;
        }
        const colSpan = getColspan(el);
        maxCols += (colSpan ? colSpan : 1);
        while (col < maxCols) {
          result[col] = (hasDataField ? $(el).attr('data-field') : col.toString());
          col++;
        }
      });
      return result;
    }

    function isVisible ($element) {
      let isRow = typeof $element[0].rowIndex !== 'undefined';
      const isCell = isRow === false && typeof $element[0].cellIndex !== 'undefined';
      const isElementVisible = (isCell || isRow) ? isTableElementVisible($element) : $element.is(':visible');
      let tableexportDisplay = $element.attr('data-tableexport-display');

      if (isCell && tableexportDisplay !== 'none' && tableexportDisplay !== 'always') {
        $element = $($element[0].parentNode);
        isRow = typeof $element[0].rowIndex !== 'undefined';
        tableexportDisplay = $element.attr('data-tableexport-display');
      }
      if (isRow && tableexportDisplay !== 'none' && tableexportDisplay !== 'always') {
        tableexportDisplay = $element.closest('table').attr('data-tableexport-display');
      }

      return tableexportDisplay !== 'none' && (isElementVisible === true || tableexportDisplay === 'always');
    }

    function isTableElementVisible ($element) {
      let hiddenEls = [];

      if (checkCellVisibility) {
        hiddenEls = $hiddenTableElements.filter(function () {
          let found = false;

          if (this.nodeType === $element[0].nodeType) {
            if (typeof this.rowIndex !== 'undefined' && this.rowIndex === $element[0].rowIndex)
              found = true;
            else if (typeof this.cellIndex !== 'undefined' && this.cellIndex === $element[0].cellIndex &&
              typeof this.parentNode.rowIndex !== 'undefined' &&
              typeof $element[0].parentNode.rowIndex !== 'undefined' &&
              this.parentNode.rowIndex === $element[0].parentNode.rowIndex)
              found = true;
          }
          return found;
        });
      }
      return (checkCellVisibility === false || hiddenEls.length === 0);
    }

    function isColumnIgnored ($cell, rowLength, colIndex) {
      let result = false;

      if (isVisible($cell)) {
        if (defaults.ignoreColumn.length > 0) {
          if ($.inArray(colIndex, defaults.ignoreColumn) !== -1 ||
            $.inArray(colIndex - rowLength, defaults.ignoreColumn) !== -1 ||
            (colNames.length > colIndex && typeof colNames[colIndex] !== 'undefined' &&
              $.inArray(colNames[colIndex], defaults.ignoreColumn) !== -1))
            result = true;
        }
      } else
        result = true;

      return result;
    }

    function ForEachVisibleCell (tableRow, selector, rowIndex, rowCount, cellcallback) {
      if (typeof (cellcallback) === 'function') {
        let ignoreRow = false;

        if (typeof defaults.onIgnoreRow === 'function')
          ignoreRow = defaults.onIgnoreRow($(tableRow), rowIndex);

        if (ignoreRow === false &&
          (defaults.ignoreRow.length === 0 ||
            ($.inArray(rowIndex, defaults.ignoreRow) === -1 &&
              $.inArray(rowIndex - rowCount, defaults.ignoreRow) === -1)) &&
          isVisible($(tableRow))) {

          const $cells = findTableElements($(tableRow), selector);
          let cellsCount = $cells.length;
          let colCount = 0;
          let colIndex = 0;

          $cells.each(function () {
            const $cell = $(this);
            let colspan = getColspan(this);
            let rowspan = getRowspan(this);
            let c;

            // Skip ranges
            $.each(ranges, function () {
              const range = this;
              if (rowIndex > range.s.r && rowIndex <= range.e.r && colCount >= range.s.c && colCount <= range.e.c) {
                for (c = 0; c <= range.e.c - range.s.c; ++c) {
                  cellsCount++;
                  colIndex++;
                  cellcallback(null, rowIndex, colCount++);
                }
              }
            });

            // Handle span's
            if (rowspan || colspan) {
              rowspan = rowspan || 1;
              colspan = colspan || 1;
              ranges.push({
                s: {r: rowIndex, c: colCount},
                e: {r: rowIndex + rowspan - 1, c: colCount + colspan - 1}
              });
            }

            if (isColumnIgnored($cell, cellsCount, colIndex++) === false) {
              // Handle value
              cellcallback(this, rowIndex, colCount++);
            }

            // Handle colspan
            if (colspan > 1) {
              for (c = 0; c < colspan - 1; ++c) {
                colIndex++;
                cellcallback(null, rowIndex, colCount++);
              }
            }
          });

          // Skip ranges
          $.each(ranges, function () {
            const range = this;
            if (rowIndex >= range.s.r && rowIndex <= range.e.r && colCount >= range.s.c && colCount <= range.e.c) {
              for (let c = 0; c <= range.e.c - range.s.c; ++c) {
                cellcallback(null, rowIndex, colCount++);
              }
            }
          });
        }
      }
    }

    function jsPdfDrawImage (cell, container, imgId, teOptions) {
      if (typeof teOptions.images !== 'undefined') {
        const image = teOptions.images[imgId];

        if (typeof image !== 'undefined') {
          const r = container.getBoundingClientRect();
          const arCell = cell.width / cell.height;
          const arImg = r.width / r.height;
          let imgWidth = cell.width;
          let imgHeight = cell.height;
          const px2pt = 0.264583 * 72 / 25.4;
          let uy = 0;

          if (arImg <= arCell) {
            imgHeight = Math.min(cell.height, r.height);
            imgWidth = r.width * imgHeight / r.height;
          } else if (arImg > arCell) {
            imgWidth = Math.min(cell.width, r.width);
            imgHeight = r.height * imgWidth / r.width;
          }

          imgWidth *= px2pt;
          imgHeight *= px2pt;

          if (imgHeight < cell.height)
            uy = (cell.height - imgHeight) / 2;

          try {
            teOptions.doc.addImage(image.src, cell.textPos.x, cell.y + uy, imgWidth, imgHeight);
          } catch (e) {
            // TODO: IE -> convert png to jpeg
          }
          cell.textPos.x += imgWidth;
        }
      }
    }

    function jsPdfOutput (doc, hasimages) {
      if (defaults.outputMode === 'string')
        return doc.output();

      if (defaults.outputMode === 'base64')
        return base64encode(doc.output());

      if (defaults.outputMode === 'window') {
        window.URL = window.URL || window.webkitURL;
        window.open(window.URL.createObjectURL(doc.output('blob')));
        return;
      }

      const fileName = defaults.fileName + '.pdf';

      try {
        const blob = doc.output('blob')
        saveAs(blob, fileName);

        if (typeof defaults.onAfterSaveToFile === 'function')
          defaults.onAfterSaveToFile(blob, fileName);
      } catch (e) {
        downloadFile(fileName,
          'data:application/pdf' + (hasimages ? '' : ';base64') + ',',
          hasimages ? doc.output('blob') : doc.output());
      }
    }

    function prepareAutoTableText (cell, data, cellopt) {
      let cs = 0
      if (typeof cellopt !== 'undefined')
        cs = cellopt.colspan;

      if (cs >= 0) {
        // colspan handling
        let cellWidth = cell.width
        let textPosX = cell.textPos.x
        const i = data.table.columns.indexOf(data.column)

        for (let c = 1; c < cs; c++) {
          const column = data.table.columns[i + c]
          cellWidth += column.width;
        }

        if (cs > 1) {
          if (cell.styles.halign === 'right')
            textPosX = cell.textPos.x + cellWidth - cell.width;
          else if (cell.styles.halign === 'center')
            textPosX = cell.textPos.x + (cellWidth - cell.width) / 2;
        }

        cell.width = cellWidth;
        cell.textPos.x = textPosX;

        if (typeof cellopt !== 'undefined' && cellopt.rowspan > 1)
          cell.height = cell.height * cellopt.rowspan;

        // fix jsPDF's calculation of text position
        if (cell.styles.valign === 'middle' || cell.styles.valign === 'bottom') {
          const splittedText = typeof cell.text === 'string' ? cell.text.split(/\r\n|\r|\n/g) : cell.text;
          const lineCount = splittedText.length || 1;
          if (lineCount > 2)
            cell.textPos.y -= ((2 - FONT_ROW_RATIO) / 2 * data.row.styles.fontSize) * (lineCount - 2) / 3;
        }
        return true;
      } else
        return false; // cell is hidden (colspan = -1), don't draw it
    }

    function collectImages (cell, elements, teOptions) {
      if (typeof cell !== 'undefined' && cell !== null) {

        if (cell.hasAttribute('data-tableexport-canvas')) {
          const imgId = new Date().getTime();
          $(cell).attr('data-tableexport-canvas', imgId);

          teOptions.images[imgId] = {
            url: '[data-tableexport-canvas="' + imgId + '"]',
            src: null
          };
        } else if (elements !== 'undefined' && elements != null) {
          elements.each(function () {
            if ($(this).is('img')) {
              const imgId = strHashCode(this.src);
              teOptions.images[imgId] = {
                url: this.src,
                src: this.src
              };
            }
            collectImages(cell, $(this).children(), teOptions);
          });
        }
      }
    }

    function loadImages (teOptions, callback) {
      let imageCount = 0;
      let pendingCount = 0;

      function done () {
        callback(imageCount);
      }

      function loadImage (image) {
        if (image.url) {
          if (!image.src) {
            const $imgContainer = $(image.url);
            if ($imgContainer.length) {
              imageCount = ++pendingCount;

              html2canvas($imgContainer[0]).then(function (canvas) {
                image.src = canvas.toDataURL('image/png');
                if (!--pendingCount)
                  done();
              });
            }
          } else {
            const img = new Image();
            imageCount = ++pendingCount;
            img.crossOrigin = 'Anonymous';
            img.onerror = img.onload = function () {
              if (img.complete) {

                if (img.src.indexOf('data:image/') === 0) {
                  img.width = image.width || img.width || 0;
                  img.height = image.height || img.height || 0;
                }

                if (img.width + img.height) {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');

                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);

                  image.src = canvas.toDataURL('image/png');
                }
              }
              if (!--pendingCount)
                done();
            };
            img.src = image.url;
          }
        }
      }

      if (typeof teOptions.images !== 'undefined') {
        for (let i in teOptions.images)
          if (teOptions.images.hasOwnProperty(i))
            loadImage(teOptions.images[i]);
      }

      return pendingCount || done();
    }

    function drawAutotableElements (cell, elements, teOptions) {
      elements.each(function () {
        if ($(this).is('div')) {
          const bColor = rgb2array(getStyle(this, 'background-color'), [255, 255, 255]);
          const lColor = rgb2array(getStyle(this, 'border-top-color'), [0, 0, 0]);
          const lWidth = getPropertyUnitValue(this, 'border-top-width', defaults.jspdf.unit);

          const r = this.getBoundingClientRect();
          const ux = this.offsetLeft * teOptions.wScaleFactor;
          const uy = this.offsetTop * teOptions.hScaleFactor;
          const uw = r.width * teOptions.wScaleFactor;
          const uh = r.height * teOptions.hScaleFactor;

          teOptions.doc.setDrawColor.apply(undefined, lColor);
          teOptions.doc.setFillColor.apply(undefined, bColor);
          teOptions.doc.setLineWidth(lWidth);
          teOptions.doc.rect(cell.x + ux, cell.y + uy, uw, uh, lWidth ? 'FD' : 'F');
        } else if ($(this).is('img')) {
          const imgId = strHashCode(this.src);
          jsPdfDrawImage(cell, this, imgId, teOptions);
        }

        drawAutotableElements(cell, $(this).children(), teOptions);
      });
    }

    function drawAutotableText (cell, texttags, teOptions) {
      if (typeof teOptions.onAutotableText === 'function') {
        teOptions.onAutotableText(teOptions.doc, cell, texttags);
      } else {
        let x = cell.textPos.x;
        let y = cell.textPos.y;
        const style = {halign: cell.styles.halign, valign: cell.styles.valign};

        if (texttags.length) {
          let tag = texttags[0];
          while (tag.previousSibling)
            tag = tag.previousSibling;

          let b = false, i = false;

          while (tag) {
            let txt = tag.innerText || tag.textContent || '';
            const leadingSpace = (txt.length && txt[0] === ' ') ? ' ' : '';
            const trailingSpace = (txt.length > 1 && txt[txt.length - 1] === ' ') ? ' ' : '';

            if (defaults.preserve.leadingWS !== true)
              txt = leadingSpace + trimLeft(txt);
            if (defaults.preserve.trailingWS !== true)
              txt = trimRight(txt) + trailingSpace;

            if ($(tag).is('br')) {
              x = cell.textPos.x;
              y += teOptions.doc.internal.getFontSize();
            }

            if ($(tag).is('b'))
              b = true;
            else if ($(tag).is('i'))
              i = true;

            if (b || i)
              teOptions.doc.setFont('undefined ', (b && i) ? 'bolditalic' : b ? 'bold' : 'italic');

            let w = teOptions.doc.getStringUnitWidth(txt) * teOptions.doc.internal.getFontSize();

            if (w) {
              if (cell.styles.overflow === 'linebreak' &&
                x > cell.textPos.x && (x + w) > (cell.textPos.x + cell.width)) {
                const chars = '.,!%*;:=-';
                if (chars.indexOf(txt.charAt(0)) >= 0) {
                  const s = txt.charAt(0);
                  w = teOptions.doc.getStringUnitWidth(s) * teOptions.doc.internal.getFontSize();
                  if ((x + w) <= (cell.textPos.x + cell.width)) {
                    jsPdfAutoTableText(s, x, y, style);
                    txt = txt.substring(1, txt.length);
                  }
                  w = teOptions.doc.getStringUnitWidth(txt) * teOptions.doc.internal.getFontSize();
                }
                x = cell.textPos.x;
                y += teOptions.doc.internal.getFontSize();
              }

              if (cell.styles.overflow !== 'visible') {
                while (txt.length && (x + w) > (cell.textPos.x + cell.width)) {
                  txt = txt.substring(0, txt.length - 1);
                  w = teOptions.doc.getStringUnitWidth(txt) * teOptions.doc.internal.getFontSize();
                }
              }

              jsPdfAutoTableText(txt, x, y, style);
              x += w;
            }

            if (b || i) {
              if ($(tag).is('b'))
                b = false;
              else if ($(tag).is('i'))
                i = false;

              teOptions.doc.setFont('undefined ', (!b && !i) ? 'normal' : b ? 'bold' : 'italic');
            }

            tag = tag.nextSibling;
          }
          cell.textPos.x = x;
          cell.textPos.y = y;
        } else {
          jsPdfAutoTableText(cell.text, cell.textPos.x, cell.textPos.y, style);
        }
      }
    }

    function escapeRegExp (string) {
      return string == null ? '' : string.toString().replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
    }

    function replaceAll (string, find, replace) {
      return string == null ? '' : string.toString().replace(new RegExp(escapeRegExp(find), 'g'), replace);
    }

    function trimLeft (string) {
      return string == null ? '' : string.toString().replace(/^\s+/, '');
    }

    function trimRight (string) {
      return string == null ? '' : string.toString().replace(/\s+$/, '');
    }

    function parseDateUTC (s) {
      if (defaults.date.html.length === 0)
        return false;

      defaults.date.pattern.lastIndex = 0;

      const match = defaults.date.pattern.exec(s);
      if (match == null)
        return false;

      const y = +match[defaults.date.match_y];
      if (y < 0 || y > 8099) return false;
      const m = match[defaults.date.match_m] * 1;
      const d = match[defaults.date.match_d] * 1;
      if (!isFinite(d)) return false;

      const o = new Date(y, m - 1, d, 0, 0, 0);
      if (o.getFullYear() === y && o.getMonth() === (m - 1) && o.getDate() === d)
        return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
      else
        return false;
    }

    function parseNumber (value) {
      value = value || '0';
      if ('' !== defaults.numbers.html.thousandsSeparator)
        value = replaceAll(value, defaults.numbers.html.thousandsSeparator, '');
      if ('.' !== defaults.numbers.html.decimalMark)
        value = replaceAll(value, defaults.numbers.html.decimalMark, '.');

      return typeof value === 'number' || jQuery.isNumeric(value) !== false ? value : false;
    }

    function parsePercent (value) {
      if (value.indexOf('%') > -1) {
        value = parseNumber(value.replace(/%/g, ''));
        if (value !== false)
          value = value / 100;
      } else
        value = false;
      return value;
    }

    function parseString (cell, rowIndex, colIndex, cellInfo) {
      let result = '';
      let cellType = 'text';

      if (cell !== null) {
        const $cell = $(cell);
        let htmlData;

        $cell.removeData('teUserDefText');

        if ($cell[0].hasAttribute('data-tableexport-canvas')) {
          htmlData = '';
        } else if ($cell[0].hasAttribute('data-tableexport-value')) {
          htmlData = $cell.attr('data-tableexport-value');
          htmlData = htmlData ? htmlData + '' : '';
          $cell.data('teUserDefText', 1);
        } else {
          htmlData = $cell.html();

          if (typeof defaults.onCellHtmlData === 'function') {
            htmlData = defaults.onCellHtmlData($cell, rowIndex, colIndex, htmlData);
            $cell.data('teUserDefText', 1);
          }
          else if (htmlData !== '') {
            const html = $.parseHTML('<div>' + htmlData + '</div>', null, false);
            let inputIndex = 0;
            let selectIndex = 0;

            htmlData = '';
            $.each(html, function () {
              if ($(this).is('input')) {
                htmlData += $cell.find('input').eq(inputIndex++).val();
              }
              else if ($(this).is('select')) {
                htmlData += $cell.find('select option:selected').eq(selectIndex++).text();
              }
              else if ($(this).is('br')) {
                htmlData += '<br>';
              }
              else {
                if (typeof $(this).html() === 'undefined')
                  htmlData += $(this).text();
                else if (jQuery().bootstrapTable === undefined ||
                  ($(this).hasClass('fht-cell') === false &&  // BT 4
                    $(this).hasClass('filterControl') === false &&
                    $cell.parents('.detail-view').length === 0))
                  htmlData += $(this).html();

                if ($(this).is('a')) {
                  const href = $cell.find('a').attr('href') || '';
                  if (typeof defaults.onCellHtmlHyperlink === 'function') {
                    result += defaults.onCellHtmlHyperlink($cell, rowIndex, colIndex, href, htmlData);
                  }
                  else if (defaults.htmlHyperlink === 'href') {
                    result += href;
                  }
                  else { // 'content'
                    result += htmlData;
                  }
                  htmlData = '';
                }
              }
            });
          }
        }

        if (htmlData && htmlData !== '' && defaults.htmlContent === true) {
          result = $.trim(htmlData);
        } else if (htmlData && htmlData !== '') {
          const cellFormat = $cell.attr('data-tableexport-cellformat');

          if (cellFormat !== '') {
            let text = htmlData.replace(/\n/g, '\u2028').replace(/(<\s*br([^>]*)>)/gi, '\u2060');
            const obj = $('<div/>').html(text).contents();
            let number = false;
            text = '';

            $.each(obj.text().split('\u2028'), function (i, v) {
              if (i > 0)
                text += ' ';

              if (defaults.preserve.leadingWS !== true)
                v = trimLeft(v);
              text += (defaults.preserve.trailingWS !== true) ? trimRight(v) : v;
            });

            $.each(text.split('\u2060'), function (i, v) {
              if (i > 0)
                result += '\n';

              if (defaults.preserve.leadingWS !== true)
                v = trimLeft(v);
              if (defaults.preserve.trailingWS !== true)
                v = trimRight(v);
              result += v.replace(/\u00AD/g, ''); // remove soft hyphens
            });

            result = result.replace(/\u00A0/g, ' '); // replace nbsp's with spaces

            if (defaults.type === 'json' ||
              (defaults.type === 'excel' && defaults.mso.fileFormat === 'xmlss') ||
              defaults.numbers.output === false) {
              number = parseNumber(result);

              if (number !== false) {
                cellType = 'number';
                result = Number(number);
              }
            } else if (defaults.numbers.html.decimalMark !== defaults.numbers.output.decimalMark ||
              defaults.numbers.html.thousandsSeparator !== defaults.numbers.output.thousandsSeparator) {
              number = parseNumber(result);

              if (number !== false) {
                const frac = ('' + number.substr(number < 0 ? 1 : 0)).split('.');
                if (frac.length === 1)
                  frac[1] = '';
                const mod = frac[0].length > 3 ? frac[0].length % 3 : 0;

                cellType = 'number';
                result = (number < 0 ? '-' : '') +
                  (defaults.numbers.output.thousandsSeparator ? ((mod ? frac[0].substr(0, mod) + defaults.numbers.output.thousandsSeparator : '') + frac[0].substr(mod).replace(/(\d{3})(?=\d)/g, '$1' + defaults.numbers.output.thousandsSeparator)) : frac[0]) +
                  (frac[1].length ? defaults.numbers.output.decimalMark + frac[1] : '');
              }
            }
          }
          else
            result = htmlData;
        }

        if (defaults.escape === true) {
          //noinspection JSDeprecatedSymbols
          result = escape(result);
        }

        if (typeof defaults.onCellData === 'function') {
          result = defaults.onCellData($cell, rowIndex, colIndex, result, cellType);
          $cell.data('teUserDefText', 1);
        }
      }

      if (cellInfo !== undefined)
        cellInfo.type = cellType;

      return result;
    }

    function preventInjection (str) {
      if (str.length > 0 && defaults.preventInjection === true) {
        const chars = '=+-@';
        if (chars.indexOf(str.charAt(0)) >= 0)
          return ('\'' + str);
      }
      return str;
    }

    //noinspection JSUnusedLocalSymbols
    function hyphenate (a, b, c) {
      return b + '-' + c.toLowerCase();
    }

    function rgb2array (rgb_string, default_result) {
      const re = /^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/;
      const bits = re.exec(rgb_string);
      let result = default_result;
      if (bits)
        result = [parseInt(bits[1]), parseInt(bits[2]), parseInt(bits[3])];
      return result;
    }

    function getCellStyles (cell) {
      let a = getStyle(cell, 'text-align');
      const fw = getStyle(cell, 'font-weight');
      const fs = getStyle(cell, 'font-style');
      let f = '';
      if (a === 'start')
        a = getStyle(cell, 'direction') === 'rtl' ? 'right' : 'left';
      if (fw >= 700)
        f = 'bold';
      if (fs === 'italic')
        f += fs;
      if (f === '')
        f = 'normal';

      const result = {
        style: {
          align: a,
          bcolor: rgb2array(getStyle(cell, 'background-color'), [255, 255, 255]),
          color: rgb2array(getStyle(cell, 'color'), [0, 0, 0]),
          fstyle: f
        },
        colspan: getColspan(cell),
        rowspan: getRowspan(cell)
      };

      if (cell !== null) {
        const r = cell.getBoundingClientRect();
        result.rect = {
          width: r.width,
          height: r.height
        };
      }

      return result;
    }

    function getColspan (cell) {
      let result = $(cell).attr('data-tableexport-colspan');
      if (typeof result === 'undefined' && $(cell).is('[colspan]'))
        result = $(cell).attr('colspan');

      return (parseInt(result) || 0);
    }

    function getRowspan (cell) {
      let result = $(cell).attr('data-tableexport-rowspan');
      if (typeof result === 'undefined' && $(cell).is('[rowspan]'))
        result = $(cell).attr('rowspan');

      return (parseInt(result) || 0);
    }

    // get computed style property
    function getStyle (target, prop) {
      try {
        if (window.getComputedStyle) { // gecko and webkit
          prop = prop.replace(/([a-z])([A-Z])/, hyphenate);  // requires hyphenated, not camel

          if (typeof target === 'object' && target.nodeType !== undefined)
            return window.getComputedStyle(target, null).getPropertyValue(prop);
          if (typeof target === 'object' && target.length)
            return target.getPropertyValue(prop);
          return '';
        }
        if (target.currentStyle) { // ie
          return target.currentStyle[prop];
        }
        return target.style[prop];
      } catch (e) {
      }
      return '';
    }

    function getUnitValue (parent, value, unit) {
      const baseline = 100;  // any number serves

      const temp = document.createElement('div');  // create temporary element
      temp.style.overflow = 'hidden';  // in case baseline is set too low
      temp.style.visibility = 'hidden';  // no need to show it

      parent.appendChild(temp); // insert it into the parent for em, ex and %

      temp.style.width = baseline + unit;
      const factor = baseline / temp.offsetWidth;

      parent.removeChild(temp);  // clean up

      return (value * factor);
    }

    function getPropertyUnitValue (target, prop, unit) {
      const value = getStyle(target, prop);  // get the computed style value

      let numeric = value.match(/\d+/);  // get the numeric component
      if (numeric !== null) {
        numeric = numeric[0];  // get the string

        return getUnitValue(target.parentElement, numeric, unit);
      }
      return 0;
    }

    function xlsxWorkbookToArrayBuffer (s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
      return buf;
    }

    function xlsxTableToSheet (table) {
      let ssfId;
      const ws = ({});
      const rows = table.getElementsByTagName('tr');
      const sheetRows = Math.min(10000000, rows.length);
      const range = {s: {r: 0, c: 0}, e: {r: 0, c: 0}};
      let merges = [], midx = 0;
      let _R = 0, R = 0, _C = 0, C = 0, RS = 0, CS = 0;
      let elt;
      const ssfTable = XLSX.SSF.get_table();

      for (; _R < rows.length && R < sheetRows; ++_R) {
        const row = rows[_R];

        let ignoreRow = false;
        if (typeof defaults.onIgnoreRow === 'function')
          ignoreRow = defaults.onIgnoreRow($(row), _R);

        if (ignoreRow === true ||
            (defaults.ignoreRow.length !== 0 &&
             ($.inArray(_R, defaults.ignoreRow) !== -1 ||
              $.inArray(_R - rows.length, defaults.ignoreRow) !== -1)) ||
            isVisible($(row)) === false) {
          continue;
        }

        const elts = (row.children);
        let _CLength = 0;
        for (_C = 0; _C < elts.length; ++_C) {
          elt = elts[_C];
          CS = +getColspan(elt) || 1;
          _CLength += CS;
        }

        let CSOffset = 0;
        for (_C = C = 0; _C < elts.length; ++_C) {
          elt = elts[_C];
          CS = +getColspan(elt) || 1;

          const col = _C + CSOffset;
          if (isColumnIgnored($(elt), _CLength, col + (col < C ? C - col : 0)))
            continue;
          CSOffset += CS - 1;

          for (midx = 0; midx < merges.length; ++midx) {
            const m = merges[midx];
            if (m.s.c == C && m.s.r <= R && R <= m.e.r) {
              C = m.e.c + 1;
              midx = -1;
            }
          }

          if ((RS = +getRowspan(elt)) > 0 || CS > 1)
            merges.push({s: {r: R, c: C}, e: {r: R + (RS || 1) - 1, c: C + CS - 1}});

          const cellInfo = {type: ''};
          let v = parseString(elt, _R, _C + CSOffset, cellInfo);
          let o = {t: 's', v: v};
          let _t = '';
          const cellFormat = $(elt).attr('data-tableexport-cellformat') || undefined;

          if (cellFormat !== '') {
            ssfId = parseInt($(elt).attr('data-tableexport-xlsxformatid') || 0);

            if (ssfId === 0 &&
              typeof defaults.mso.xlsx.formatId.numbers === 'function')
              ssfId = defaults.mso.xlsx.formatId.numbers($(elt), _R, _C + CSOffset);

            if (ssfId === 0 &&
              typeof defaults.mso.xlsx.formatId.date === 'function')
              ssfId = defaults.mso.xlsx.formatId.date($(elt), _R, _C + CSOffset);

            if (ssfId === 49 || ssfId === '@')
              _t = 's';
            else if (cellInfo.type === 'number' ||
              (ssfId > 0 && ssfId < 14) || (ssfId > 36 && ssfId < 41) || ssfId === 48)
              _t = 'n';
            else if (cellInfo.type === 'date' ||
              (ssfId > 13 && ssfId < 37) || (ssfId > 44 && ssfId < 48) || ssfId === 56)
              _t = 'd';
          } else
            _t = 's';

          if (v !== null && v !== undefined) {
            let vd;

            if (typeof v === 'string' && v.length === 0) {
              o.t = 'z';
            }
            else if (typeof v === 'string' && v.trim().length === 0) {
            }
            else if (_t === 's') {
            }
            else if (cellInfo.type === 'function') {
              o = {f: v};
            }
            else if (typeof v === 'string' && v.toUpperCase() === 'TRUE') {
              o = {t: 'b', v: true};
            }
            else if (typeof v === 'string' && v.toUpperCase() === 'FALSE') {
              o = {t: 'b', v: false};
            }
            else if (_t === 'n' || isFinite(xlsxToNumber(v, defaults.numbers.output))) { // yes, defaults.numbers.output is right
              const vn = xlsxToNumber(v, defaults.numbers.output);
              if (ssfId === 0 && typeof defaults.mso.xlsx.formatId.numbers !== 'function') {
                ssfId = defaults.mso.xlsx.formatId.numbers;
              }
              if (isFinite(vn) || isFinite(v))
                o = {
                  t: 'n',
                  v: (isFinite(vn) ? vn : v),
                  z: (typeof ssfId === 'string') ? ssfId :
                      (ssfId in ssfTable ? ssfTable[ssfId] :
                          ssfId === defaults.mso.xlsx.formatId.currency ? defaults.mso.xlsx.format.currency :
                              '0.00')
                };
            }
            else if ((vd = parseDateUTC(v)) !== false || _t === 'd') {
              if (ssfId === 0 && typeof defaults.mso.xlsx.formatId.date !== 'function') {
                ssfId = defaults.mso.xlsx.formatId.date;
              }
              o = {
                t: 'd',
                v: (vd !== false ? vd : v),
                z: (typeof ssfId === 'string') ? ssfId : (ssfId in ssfTable ? ssfTable[ssfId] : 'm/d/yy')
              };
            }
            const $aTag = $(elt).find('a');
            if ($aTag && $aTag.length) {
              const href = $aTag[0].hasAttribute("href") ? $aTag.attr('href') : '';
              const content = (defaults.htmlHyperlink !== 'href' || href === '') ? v : '';
              const hyperlink = (href !== '') ? '=HYPERLINK("' + href + (content.length ? '","' + content : '') + '")' : '';

              if (hyperlink !== '') {
                if (typeof defaults.mso.xlsx.onHyperlink === 'function') {
                  v = defaults.mso.xlsx.onHyperlink($(elt), _R, _C, href, content, hyperlink);
                  if (v.indexOf('=HYPERLINK') !== 0) {
                    o = {t: 's', v: v};
                  } else {
                    o = {f: v};
                  }
                } else {
                  o = {f: hyperlink};
                }
              }
            }
          }
          ws[xlsxEncodeCell({c: C, r: R})] = o;
          if (range.e.c < C) {
            range.e.c = C;
          }
          C += CS;
        }
        ++R;
      }
      if (merges.length) {
        ws['!merges'] = (ws["!merges"] || []).concat(merges);
      }
      range.e.r = Math.max(range.e.r, R - 1);
      ws['!ref'] = xlsxEncodeRange(range);
      if (R >= sheetRows) {
        ws['!fullref'] = xlsxEncodeRange((range.e.r = rows.length - _R + R - 1, range));
      }
      return ws;
    }

    function xlsxEncodeRow (row) {
      return '' + (row + 1);
    }

    function xlsxEncodeCol (col) {
      let s = '';
      for (++col; col; col = Math.floor((col - 1) / 26)) {
        s = String.fromCharCode(((col - 1) % 26) + 65) + s;
      }
      return s;
    }

    function xlsxEncodeCell (cell) {
      return xlsxEncodeCol(cell.c) + xlsxEncodeRow(cell.r);
    }

    function xlsxEncodeRange (cs, ce) {
      if (typeof ce === 'undefined' || typeof ce === 'number') {
        return xlsxEncodeRange(cs.s, cs.e);
      }
      if (typeof cs !== 'string') {
        cs = xlsxEncodeCell((cs));
      }
      if (typeof ce !== 'string') {
        ce = xlsxEncodeCell((ce));
      }
      return cs === ce ? cs : cs + ':' + ce;
    }

    function xlsxToNumber (s, numbersFormat) {
      let v = Number(s);
      if (isFinite(v)) return v;
      let wt = 1;
      let ss = s;
      if ('' !== numbersFormat.thousandsSeparator)
        ss = ss.replace(new RegExp('([\\d])' + numbersFormat.thousandsSeparator + '([\\d])', 'g'), '$1$2');
      if ('.' !== numbersFormat.decimalMark)
        ss = ss.replace(new RegExp('([\\d])' + numbersFormat.decimalMark + '([\\d])', 'g'), '$1.$2');
      ss = ss.replace(/[$]/g, '').replace(/[%]/g, function () {
        wt *= 100;
        return '';
      });
      if (isFinite(v = Number(ss))) return v / wt;
      ss = ss.replace(/[(](.*)[)]/, function ($$, $1) {
        wt = -wt;
        return $1;
      });
      if (isFinite(v = Number(ss))) return v / wt;
      return v;
    }

    function strHashCode (str) {
      let hash = 0, i, chr, len;
      if (str.length === 0) return hash;
      for (i = 0, len = str.length; i < len; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
      }
      return hash;
    }

    function saveToFile (data, fileName, type, charset, encoding, bom) {
      let saveIt = true;
      if (typeof defaults.onBeforeSaveToFile === 'function') {
        saveIt = defaults.onBeforeSaveToFile(data, fileName, type, charset, encoding);
        if (typeof saveIt !== 'boolean')
          saveIt = true;
      }

      if (saveIt) {
        try {
          if (bom)
            blob = new Blob([String.fromCharCode(0xFEFF), [data]], { type: type + ';charset=' + charset});
          else
            blob = new Blob([data], {type: type + ';charset=' + charset});
          saveAs(blob, fileName, {autoBom: false});

          if (typeof defaults.onAfterSaveToFile === 'function')
            defaults.onAfterSaveToFile(data, fileName);
        } catch (e) {
          downloadFile(fileName,
            'data:' + type +
            (charset.length ? ';charset=' + charset : '') +
            (encoding.length ? ';' + encoding : '') + ',',
            (bom ? ('\ufeff' + data) : data));
        }
      }
    }

    function downloadFile (filename, header, data) {
      const ua = window.navigator.userAgent;
      if (filename !== false && window.navigator.msSaveOrOpenBlob) {
        //noinspection JSUnresolvedFunction
        window.navigator.msSaveOrOpenBlob(new Blob([data]), filename);
      } else if (filename !== false && (ua.indexOf('MSIE ') > 0 || !!ua.match(/Trident.*rv\:11\./))) {
        // Internet Explorer (<= 9) workaround by Darryl (https://github.com/dawiong/tableExport.jquery.plugin)
        // based on sampopes answer on http://stackoverflow.com/questions/22317951
        // ! Not working for json and pdf format !
        const frame = document.createElement('iframe');

        if (frame) {
          document.body.appendChild(frame);
          frame.setAttribute('style', 'display:none');
          frame.contentDocument.open('txt/plain', 'replace');
          frame.contentDocument.write(data);
          frame.contentDocument.close();
          frame.contentWindow.focus();

          const extension = filename.substr((filename.lastIndexOf('.') + 1));
          switch (extension) {
            case 'doc':
            case 'json':
            case 'png':
            case 'pdf':
            case 'xls':
            case 'xlsx':
              filename += '.txt';
              break;
          }
          frame.contentDocument.execCommand('SaveAs', true, filename);
          document.body.removeChild(frame);
        }
      } else {
        const DownloadLink = document.createElement('a');

        if (DownloadLink) {
          let blobUrl = null;

          DownloadLink.style.display = 'none';
          if (filename !== false)
            DownloadLink.download = filename;
          else
            DownloadLink.target = '_blank';

          if (typeof data === 'object') {
            window.URL = window.URL || window.webkitURL;
            const binaryData = [];
            binaryData.push(data);
            blobUrl = window.URL.createObjectURL(new Blob(binaryData, {type: header}));
            DownloadLink.href = blobUrl;
          }
          else if (header.toLowerCase().indexOf('base64,') >= 0) {
            DownloadLink.href = header + base64encode(data);
          }
          else {
            DownloadLink.href = header + encodeURIComponent(data);
          }

          document.body.appendChild(DownloadLink);

          if (document.createEvent) {
            if (DownloadEvt === null)
              DownloadEvt = document.createEvent('MouseEvents');

            DownloadEvt.initEvent('click', true, false);
            DownloadLink.dispatchEvent(DownloadEvt);
          }
          else if (document.createEventObject)
            DownloadLink.fireEvent('onclick');
          else if (typeof DownloadLink.onclick === 'function')
            DownloadLink.onclick();

          setTimeout(function () {
            if (blobUrl)
              window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(DownloadLink);

            if (typeof defaults.onAfterSaveToFile === 'function')
              defaults.onAfterSaveToFile(data, filename);
          }, 100);
        }
      }
    }

    function utf8Encode (text) {
      if (typeof text === 'string') {
        text = text.replace(/\x0d\x0a/g, '\x0a');
        let utfText = '';
        for (let n = 0; n < text.length; n++) {
          const c = text.charCodeAt(n);
          if (c < 128) {
            utfText += String.fromCharCode(c);
          } else if ((c > 127) && (c < 2048)) {
            utfText += String.fromCharCode((c >> 6) | 192);
            utfText += String.fromCharCode((c & 63) | 128);
          } else {
            utfText += String.fromCharCode((c >> 12) | 224);
            utfText += String.fromCharCode(((c >> 6) & 63) | 128);
            utfText += String.fromCharCode((c & 63) | 128);
          }
        }
        return utfText;
      }
      return text;
    }

    function base64encode (input) {
      let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let output = '';
      let i = 0;
      input = utf8Encode(input);
      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        enc4 = chr3 & 63;
        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }
        output = output +
          keyStr.charAt(enc1) + keyStr.charAt(enc2) +
          keyStr.charAt(enc3) + keyStr.charAt(enc4);
      }
      return output;
    }

    // ----------------------------------------------------------------------------------------------------
    // jsPDF-AutoTable 2.0.17 - BEGIN
    // Adopted and adapted source code from https://github.com/simonbengtsson/jsPDF-AutoTable
    // ----------------------------------------------------------------------------------------------------

    var jsPdfDoc, // The current jspdf instance
        jsPdfCursor, // An object keeping track of the x and y position of the next table cell to draw
        jsPdfSettings, // Default options merged with user options
        jsPdfPageCount, // The  page count the current table spans
        jsPdfTable; // The current Table instance

    function jsPdfAutoTable (doc, headers, data, options) {
      jsPdfValidateInput(headers, data, options);
      jsPdfDoc = doc;
      jsPdfSettings = jsPdfInitOptions(options || {});
      jsPdfPageCount = 1;

      // Need a cursor y as it needs to be reset after each page (row.y can't do that)
      jsPdfCursor = { y: jsPdfSettings.startY === false ? jsPdfSettings.margin.top : jsPdfSettings.startY };

      const userStyles = {
        textColor: 30, // Setting text color to dark gray as it can't be obtained from jsPDF
        fontSize: jsPdfDoc.internal.getFontSize(),
        fontStyle: jsPdfDoc.internal.getFont().fontStyle,
        fontName: jsPdfDoc.internal.getFont().fontName
      };

      // Create the table model with its columns, rows and cells
      jsPdfCreateModels(headers, data);
      jsPdfCalculateWidths();

      // Page break if there is room for only the first data row
      const firstRowHeight = jsPdfTable.rows[0] && jsPdfSettings.pageBreak === 'auto' ? jsPdfTable.rows[0].height : 0;
      let minTableBottomPos = jsPdfSettings.startY + jsPdfSettings.margin.bottom + jsPdfTable.headerRow.height + firstRowHeight;
      if (jsPdfSettings.pageBreak === 'avoid') {
        minTableBottomPos += jsPdfTable.height;
      }
      if ((jsPdfSettings.pageBreak === 'always' && jsPdfSettings.startY !== false) ||
        (jsPdfSettings.startY !== false && minTableBottomPos > jsPdfDoc.internal.pageSize.height)) {
        jsPdfDoc.addPage();
        jsPdfCursor.y = jsPdfSettings.margin.top;
      }

      jsPdfApplyStyles(userStyles);
      jsPdfSettings.beforePageContent(jsPdfHooksData());
      if (jsPdfSettings.drawHeaderRow(jsPdfTable.headerRow, jsPdfHooksData({row: jsPdfTable.headerRow})) !== false) {
        jsPdfPrintRow(jsPdfTable.headerRow, jsPdfSettings.drawHeaderCell);
      }
      jsPdfApplyStyles(userStyles);
      jsPdfPrintRows();
      jsPdfSettings.afterPageContent(jsPdfHooksData());

      jsPdfApplyStyles(userStyles);

      return jsPdfDoc;
    }

    /**
     * Returns the Y position of the last drawn cell
     * @returns int
     */
    function jsPdfAutoTableEndPosY () {
      if (typeof jsPdfCursor === 'undefined' || typeof jsPdfCursor.y === 'undefined') {
        return 0;
      }
      return jsPdfCursor.y;
    }

    /**
     * Improved text function with halign and valign support
     * Inspiration from:
     * http://stackoverflow.com/questions/28327510/align-text-right-using-jspdf/28433113#28433113
     */
    function jsPdfAutoTableText (text, x, y, styles) {
      if (typeof x !== 'number' || typeof y !== 'number') {
        console.error('The x and y parameters are required. Missing for the text: ', text);
      }
      const fontSize = jsPdfDoc.internal.getFontSize() / jsPdfDoc.internal.scaleFactor;

      // As defined in jsPDF source code
      const lineHeightProportion = FONT_ROW_RATIO;

      const splitRegex = /\r\n|\r|\n/g;
      let splittedText = null;
      let lineCount = 1;
      if (styles.valign === 'middle' || styles.valign === 'bottom' || styles.halign === 'center' || styles.halign === 'right') {
        splittedText = typeof text === 'string' ? text.split(splitRegex) : text;

        lineCount = splittedText.length || 1;
      }

      // Align the top
      y += fontSize * (2 - lineHeightProportion);

      if (styles.valign === 'middle')
        y -= (lineCount / 2) * fontSize;
      else if (styles.valign === 'bottom')
        y -= lineCount * fontSize;

      if (styles.halign === 'center' || styles.halign === 'right') {
        let alignSize = fontSize;
        if (styles.halign === 'center')
          alignSize *= 0.5;

        if (splittedText && lineCount >= 1) {
          for (let iLine = 0; iLine < splittedText.length; iLine++) {
            jsPdfDoc.text(splittedText[iLine], x - jsPdfDoc.getStringUnitWidth(splittedText[iLine]) * alignSize, y);
            y += fontSize;
          }
          return jsPdfDoc;
        }
        x -= jsPdfDoc.getStringUnitWidth(text) * alignSize;
      }

      jsPdfDoc.text(text, x, y);
      return jsPdfDoc;
    }

    function jsPdfValidateInput(headers, data, options) {
      if (!headers || typeof headers !== 'object') {
        console.error("The headers should be an object or array, is: " + typeof headers);
      }

      if (!data || typeof data !== 'object') {
        console.error("The data should be an object or array, is: " + typeof data);
      }

      if (!!options && typeof options !== 'object') {
        console.error("The data should be an object or array, is: " + typeof data);
      }

      if (!Array.prototype.forEach) {
        console.error("The current browser does not support Array.prototype.forEach which is required for jsPDF-AutoTable");
      }
    }

    function jsPdfInitOptions(userOptions) {
      const settings = jsPdfExtend(jsPdfDefaultOptions(), userOptions);

      // Options
      if (typeof settings.extendWidth !== 'undefined') {
        settings.tableWidth = settings.extendWidth ? 'auto' : 'wrap';
        console.error("Use of deprecated option: extendWidth, use tableWidth instead.");
      }
      if (typeof settings.margins !== 'undefined') {
        if (typeof settings.margin === 'undefined') settings.margin = settings.margins;
        console.error("Use of deprecated option: margins, use margin instead.");
      }

      [['padding', 'cellPadding'], ['lineHeight', 'rowHeight'], 'fontSize', 'overflow'].forEach(function (o) {
        const deprecatedOption = typeof o === 'string' ? o : o[0];
        const style = typeof o === 'string' ? o : o[1];
        if (typeof settings[deprecatedOption] !== 'undefined') {
          if (typeof settings.styles[style] === 'undefined') {
            settings.styles[style] = settings[deprecatedOption];
          }
          console.error("Use of deprecated option: " + deprecatedOption + ", use the style " + style + " instead.");
        }
      });

      // Unifying
      const marginSetting = settings.margin;
      settings.margin = {};
      if (typeof marginSetting.horizontal === 'number') {
        marginSetting.right = marginSetting.horizontal;
        marginSetting.left = marginSetting.horizontal;
      }
      if (typeof marginSetting.vertical === 'number') {
        marginSetting.top = marginSetting.vertical;
        marginSetting.bottom = marginSetting.vertical;
      }
      ['top', 'right', 'bottom', 'left'].forEach(function (side, i) {
        if (typeof marginSetting === 'number') {
          settings.margin[side] = marginSetting;
        } else {
          const key = Array.isArray(marginSetting) ? i : side;
          settings.margin[side] = typeof marginSetting[key] === 'number' ? marginSetting[key] : 40;
        }
      });

      return settings;
    }

    /**
     * Create models from the user input
     *
     * @param inputHeaders
     * @param inputData
     */
    function jsPdfCreateModels(inputHeaders, inputData) {
      jsPdfTable = new jsPdfTableClass();
      jsPdfTable.x = jsPdfSettings.margin.left;

      const splitRegex = /\r\n|\r|\n/g;

      // Header row and columns
      const headerRow = new jsPdfRowClass(inputHeaders);
      headerRow.index = -1;

      const themeStyles = jsPdfExtend(jsPdfDefaultStyles, jsPdfThemes[jsPdfSettings.theme].table, jsPdfThemes[jsPdfSettings.theme].header);
      headerRow.styles = jsPdfExtend(themeStyles, jsPdfSettings.styles, jsPdfSettings.headerStyles);

      // Columns and header row
      inputHeaders.forEach(function (rawColumn, dataKey) {
        if (typeof rawColumn === 'object') {
          dataKey = typeof rawColumn.dataKey !== 'undefined' ? rawColumn.dataKey : rawColumn.key;
        }

        if (typeof rawColumn.width !== 'undefined') {
          console.error("Use of deprecated option: column.width, use column.styles.columnWidth instead.");
        }

        const col = new jsPdfColumnClass(dataKey);
        col.styles = jsPdfSettings.columnStyles[col.dataKey] || {};
        jsPdfTable.columns.push(col);

        const cell = new jsPdfCellClass();
        cell.raw = typeof rawColumn === 'object' ? rawColumn.title : rawColumn;

        // jsPDF AutoTable plugin v2.0.14 fix: each cell needs its own styles object
        //cell.styles = jsPdfExtend(headerRow.styles);
        cell.styles = $.extend({}, headerRow.styles);

        cell.text = '' + cell.raw;
        cell.contentWidth = cell.styles.cellPadding * 2 + jsPdfGetStringWidth(cell.text, cell.styles);
        cell.text = cell.text.split(splitRegex);

        headerRow.cells[dataKey] = cell;
        jsPdfSettings.createdHeaderCell(cell, {column: col, row: headerRow, settings: jsPdfSettings});
      });
      jsPdfTable.headerRow = headerRow;

      // Rows och cells
      inputData.forEach(function (rawRow, i) {
        const row = new jsPdfRowClass(rawRow);
        const isAlternate = i % 2 === 0;
        const themeStyles = jsPdfExtend(jsPdfDefaultStyles, jsPdfThemes[jsPdfSettings.theme].table, isAlternate ? jsPdfThemes[jsPdfSettings.theme].alternateRow : {});
        const userStyles = jsPdfExtend(jsPdfSettings.styles, jsPdfSettings.bodyStyles, isAlternate ? jsPdfSettings.alternateRowStyles : {});
        row.styles = jsPdfExtend(themeStyles, userStyles);
        row.index = i;
        jsPdfTable.columns.forEach(function (column) {
          const cell = new jsPdfCellClass();
          cell.raw = rawRow[column.dataKey];
          cell.styles = jsPdfExtend(row.styles, column.styles);
          cell.text = typeof cell.raw !== 'undefined' ? '' + cell.raw : ''; // Stringify 0 and false, but not undefined
          row.cells[column.dataKey] = cell;
          jsPdfSettings.createdCell(cell, jsPdfHooksData({column: column, row: row}));
          cell.contentWidth = cell.styles.cellPadding * 2 + jsPdfGetStringWidth(cell.text, cell.styles);
          cell.text = cell.text.split(splitRegex);
        });
        jsPdfTable.rows.push(row);
      });
    }

    /**
     * Calculate the column widths
     */
    function jsPdfCalculateWidths() {
      // Column and table content width
      let tableContentWidth = 0;
      jsPdfTable.columns.forEach(function (column) {
        column.contentWidth = jsPdfTable.headerRow.cells[column.dataKey].contentWidth;
        jsPdfTable.rows.forEach(function (row) {
          const cellWidth = row.cells[column.dataKey].contentWidth;
          if (cellWidth > column.contentWidth) {
            column.contentWidth = cellWidth;
          }
        });
        column.width = column.contentWidth;
        tableContentWidth += column.contentWidth;
      });
      jsPdfTable.contentWidth = tableContentWidth;

      const maxTableWidth = jsPdfDoc.internal.pageSize.width - jsPdfSettings.margin.left - jsPdfSettings.margin.right;
      let preferredTableWidth = maxTableWidth; // settings.tableWidth === 'auto'
      if (typeof jsPdfSettings.tableWidth === 'number') {
        preferredTableWidth = jsPdfSettings.tableWidth;
      } else if (jsPdfSettings.tableWidth === 'wrap') {
        preferredTableWidth = jsPdfTable.contentWidth;
      }
      jsPdfTable.width = preferredTableWidth < maxTableWidth ? preferredTableWidth : maxTableWidth;

      // To avoid subjecting columns with little content with the chosen overflow method,
      // never shrink a column more than the table divided by column count (its "fair part")
      const dynamicColumns = [];
      let dynamicColumnsContentWidth = 0;
      const fairWidth = jsPdfTable.width / jsPdfTable.columns.length;
      let staticWidth = 0;
      jsPdfTable.columns.forEach(function (column) {
        const colStyles = jsPdfExtend(jsPdfDefaultStyles, jsPdfThemes[jsPdfSettings.theme].table, jsPdfSettings.styles, column.styles);
        if (colStyles.columnWidth === 'wrap') {
          column.width = column.contentWidth;
        } else if (typeof colStyles.columnWidth === 'number') {
          column.width = colStyles.columnWidth;
        } else if (colStyles.columnWidth === 'auto' || true) {
          if (column.contentWidth <= fairWidth && jsPdfTable.contentWidth > jsPdfTable.width) {
            column.width = column.contentWidth;
          } else {
            dynamicColumns.push(column);
            dynamicColumnsContentWidth += column.contentWidth;
            column.width = 0;
          }
        }
        staticWidth += column.width;
      });

      // Distributes extra width or trims columns down to fit
      jsPdfDistributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);

      // Row height, table height and text overflow
      jsPdfTable.height = 0;
      const all = jsPdfTable.rows.concat(jsPdfTable.headerRow);
      all.forEach(function (row, i) {
        let lineBreakCount = 0;
        let cursorX = jsPdfTable.x;
        jsPdfTable.columns.forEach(function (col) {
          const cell = row.cells[col.dataKey];
          col.x = cursorX;
          jsPdfApplyStyles(cell.styles);
          const textSpace = col.width - cell.styles.cellPadding * 2;
          if (cell.styles.overflow === 'linebreak') {
            // Add one pt to textSpace to fix rounding error
            cell.text = jsPdfDoc.splitTextToSize(cell.text, textSpace + 1, {fontSize: cell.styles.fontSize});
          } else if (cell.styles.overflow === 'ellipsize') {
            cell.text = jsPdfEllipsize(cell.text, textSpace, cell.styles);
          } else if (cell.styles.overflow === 'visible') {
            // Do nothing
          } else if (cell.styles.overflow === 'hidden') {
            cell.text = jsPdfEllipsize(cell.text, textSpace, cell.styles, '');
          } else if (typeof cell.styles.overflow === 'function') {
            cell.text = cell.styles.overflow(cell.text, textSpace);
          } else {
            console.error("Unrecognized overflow type: " + cell.styles.overflow);
          }
          const count = Array.isArray(cell.text) ? cell.text.length - 1 : 0;
          if (count > lineBreakCount) {
            lineBreakCount = count;
          }
          cursorX += col.width;
        });

        row.heightStyle = row.styles.rowHeight;
        // TODO Pick the highest row based on font size as well
        row.height = (row.heightStyle + lineBreakCount * row.styles.fontSize * FONT_ROW_RATIO) +
                     ((2 - FONT_ROW_RATIO) / 2 * row.styles.fontSize); // Fix jsPDF Autotable's row height calculation

        jsPdfTable.height += row.height;
      });
    }

    function jsPdfDistributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth) {
      const extraWidth = jsPdfTable.width - staticWidth - dynamicColumnsContentWidth;
      for (let i = 0; i < dynamicColumns.length; i++) {
        const col = dynamicColumns[i];
        const ratio = col.contentWidth / dynamicColumnsContentWidth;
        // A column turned out to be none dynamic, start over recursively
        const isNoneDynamic = col.contentWidth + extraWidth * ratio < fairWidth;
        if (extraWidth < 0 && isNoneDynamic) {
          dynamicColumns.splice(i, 1);
          dynamicColumnsContentWidth -= col.contentWidth;
          col.width = fairWidth;
          staticWidth += col.width;
          jsPdfDistributeWidth(dynamicColumns, staticWidth, dynamicColumnsContentWidth, fairWidth);
          break;
        } else {
          col.width = col.contentWidth + extraWidth * ratio;
        }
      }
    }

    function jsPdfPrintRows() {
      jsPdfTable.rows.forEach(function (row, i) {
        if (jsPdfIsNewPage(row.height)) {
          jsPdfAddPage();
        }
        row.y = jsPdfCursor.y;
        if (jsPdfSettings.drawRow(row, jsPdfHooksData({row: row})) !== false) {
          jsPdfPrintRow(row, jsPdfSettings.drawCell);
        }
      });
    }

    function jsPdfAddPage() {
      jsPdfSettings.afterPageContent(jsPdfHooksData());
      jsPdfDoc.addPage();
      jsPdfPageCount++;
      jsPdfCursor = {x: jsPdfSettings.margin.left, y: jsPdfSettings.margin.top};
      jsPdfSettings.beforePageContent(jsPdfHooksData());
      if (jsPdfSettings.drawHeaderRow(jsPdfTable.headerRow, jsPdfHooksData({row: jsPdfTable.headerRow})) !== false) {
        jsPdfPrintRow(jsPdfTable.headerRow, jsPdfSettings.drawHeaderCell);
      }
    }

    /**
     * Add a new page if cursor is at the end of page
     * @param rowHeight
     * @returns {boolean}
     */
    function jsPdfIsNewPage(rowHeight) {
      const afterRowPos = jsPdfCursor.y + rowHeight + jsPdfSettings.margin.bottom;
      return afterRowPos >= jsPdfDoc.internal.pageSize.height;
    }

    function jsPdfPrintRow(row, hookHandler) {
      for (let i = 0; i < jsPdfTable.columns.length; i++) {
        const column = jsPdfTable.columns[i];
        const cell = row.cells[column.dataKey];
        if(!cell) {
          continue;
        }
        jsPdfApplyStyles(cell.styles);

        cell.x = column.x;
        cell.y = jsPdfCursor.y;
        cell.height = row.height;
        cell.width = column.width;

        if (cell.styles.valign === 'top') {
          cell.textPos.y = jsPdfCursor.y + cell.styles.cellPadding;
        } else if (cell.styles.valign === 'bottom') {
          cell.textPos.y = jsPdfCursor.y + row.height - cell.styles.cellPadding;
        } else {
          cell.textPos.y = jsPdfCursor.y + row.height / 2;
        }

        if (cell.styles.halign === 'right') {
          cell.textPos.x = cell.x + cell.width - cell.styles.cellPadding;
        } else if (cell.styles.halign === 'center') {
          cell.textPos.x = cell.x + cell.width / 2;
        } else {
          cell.textPos.x = cell.x + cell.styles.cellPadding;
        }

        const data = jsPdfHooksData({column: column, row: row});
        if (hookHandler(cell, data) !== false) {
          jsPdfDoc.rect(cell.x, cell.y, cell.width, cell.height, cell.styles.fillStyle);
          jsPdfAutoTableText(cell.text, cell.textPos.x, cell.textPos.y, {
            halign: cell.styles.halign,
            valign: cell.styles.valign
          });
        }
      }

      jsPdfCursor.y += row.height;
    }

    function jsPdfApplyStyles(styles) {
      const arr = [
        {func: jsPdfDoc.setFillColor, value: styles.fillColor},
        {func: jsPdfDoc.setTextColor, value: styles.textColor},
        {func: jsPdfDoc.setFont, value: styles.font, style: styles.fontStyle},
        {func: jsPdfDoc.setDrawColor, value: styles.lineColor},
        {func: jsPdfDoc.setLineWidth, value: styles.lineWidth},
        {func: jsPdfDoc.setFont, value: styles.font},
        {func: jsPdfDoc.setFontSize, value: styles.fontSize}
      ];
      arr.forEach(function (obj) {
        if (typeof obj.value !== 'undefined') {
          if (obj.value.constructor === Array) {
            obj.func.apply(jsPdfDoc, obj.value);
          } else if (typeof obj.style !== 'undefined') {
            obj.func(obj.value, obj.style);
          } else {
            obj.func(obj.value);
          }
        }
      });
    }

    function jsPdfHooksData(additionalData) {
      additionalData = additionalData || {};
      const data = {
        pageCount: jsPdfPageCount,
        settings: jsPdfSettings,
        table: jsPdfTable,
        cursor: jsPdfCursor
      };
      for (let prop in additionalData) {
        if (additionalData.hasOwnProperty(prop)) {
          data[prop] = additionalData[prop];
        }
      }
      return data;
    }

    /**
     * Ellipsize the text to fit in the width
     */
    function jsPdfEllipsize(text, width, styles, ellipsizeStr) {
      ellipsizeStr = typeof  ellipsizeStr !== 'undefined' ? ellipsizeStr : '...';

      if (Array.isArray(text)) {
        text.forEach(function (str, i) {
          text[i] = jsPdfEllipsize(str, width, styles, ellipsizeStr);
        });
        return text;
      }

      if (width >= jsPdfGetStringWidth(text, styles)) {
        return text;
      }
      while (width < jsPdfGetStringWidth(text + ellipsizeStr, styles)) {
        if (text.length < 2) {
          break;
        }
        text = text.substring(0, text.length - 1);
      }
      return text.trim() + ellipsizeStr;
    }

    function jsPdfGetStringWidth(text, styles) {
      jsPdfApplyStyles(styles);
      const w = jsPdfDoc.getStringUnitWidth(text);
      return w * styles.fontSize;
    }

    function jsPdfExtend(defaults) {
      const extended = {};
      let prop;
      for (prop in defaults) {
        if (defaults.hasOwnProperty(prop)) {
          extended[prop] = defaults[prop];
        }
      }
      for (let i = 1; i < arguments.length; i++) {
        const options = arguments[i]
        for (prop in options) {
          if (options.hasOwnProperty(prop)) {
            extended[prop] = options[prop];
          }
        }
      }
      return extended;
    }

    // ----------------------------------------------------------------------------------------------------
    // jsPDF-AutoTable 2.0.17 - END
    // ----------------------------------------------------------------------------------------------------

    if (typeof defaults.onTableExportEnd === 'function')
      defaults.onTableExportEnd();

    return this;
  };

  // See README.md for documentation of the options
  // See examples.js for usage examples
  function jsPdfDefaultOptions () {
    return {
      // Styling
      theme: 'striped', // 'striped', 'grid' or 'plain'
      styles: {},
      headerStyles: {},
      bodyStyles: {},
      alternateRowStyles: {},
      columnStyles: {},

      // Properties
      startY: false, // false indicates the margin.top value
      margin: 40,
      pageBreak: 'auto', // 'auto', 'avoid', 'always'
      tableWidth: 'auto', // number, 'auto', 'wrap'

      // Hooks
      createdHeaderCell: function (cell, data) {},
      createdCell: function (cell, data) {},
      drawHeaderRow: function (row, data) {},
      drawRow: function (row, data) {},
      drawHeaderCell: function (cell, data) {},
      drawCell: function (cell, data) {},
      beforePageContent: function (data) {},
      afterPageContent: function (data) {}
    }
  }

  var jsPdfTableClass = /** class */ (function () {
    function jsPdfTableClass() { /** constructor */
      this.height = 0;
      this.width = 0;
      this.x = 0;
      this.y = 0;
      this.contentWidth = 0;
      this.rows = [];
      this.columns = [];
      this.headerRow = null;
      this.settings = {};
    }
    return jsPdfTableClass;
  }());

  var jsPdfRowClass = /** class */ (function () {
    function jsPdfRowClass(raw) { /** constructor */
      this.raw = raw || {};
      this.index = 0;
      this.styles = {};
      this.cells = {};
      this.height = 0;
      this.y = 0;
    }
    return jsPdfRowClass;
  }());

  var jsPdfCellClass = /** class */ (function () {
    function jsPdfCellClass(raw) { /** constructor */
      this.raw = raw;
      this.styles = {};
      this.text = '';
      this.contentWidth = 0;
      this.textPos = {};
      this.height = 0;
      this.width = 0;
      this.x = 0;
      this.y = 0;
    }
    return jsPdfCellClass;
  }());

  var jsPdfColumnClass = /** class */ (function () {
    function jsPdfColumnClass(dataKey) { /** constructor */
      this.dataKey = dataKey;
      this.options = {};
      this.styles = {};
      this.contentWidth = 0;
      this.width = 0;
      this.x = 0;
    }
    return jsPdfColumnClass;
  }());

})(jQuery);
