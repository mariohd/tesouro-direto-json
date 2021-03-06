var cheerio = require('cheerio');
var http = require('http');

var extract = {
    extraction_info: [],
    callback: null,

    starter: function(callback) {
        this.callback = callback;

        var options = {
            host: 'www.tesouro.fazenda.gov.br',
            path: '/tesouro-direto-precos-e-taxas-dos-titulos'
        }

        var request = http.request(options, function(res) {
            var data = '';
            res.on('data', function(chunk) {
                data += chunk;
            });

            res.on('end', function() {
                extract.get_data(data);
            });
        });

        request.on('error', function(e) {
            console.log(e.message);
        });

        request.end();
    },

    get_data: function(data) {
        $ = cheerio.load(data);
        let invest = $('.portlet-body > table.tabelaPrecoseTaxas:not(".sanfonado") tbody tr.camposTesouroDireto').toArray();
        let rescue = $('.portlet-body > .sanfonado table.tabelaPrecoseTaxas tbody tr.camposTesouroDireto').toArray();
        let status = $('.mercadostatus').attr('class').split(' ').filter(function(e) {return 'mercadostatus' != e; });
        let lastUpdate = $('.portlet-body > b').text();
        let updated = new Date(lastUpdate.replace( /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, "$2/$1/$3 $4:$5"));
        
        this.callback({
            "investir": extract.parseTableLines(invest, true),
            "resgatar": extract.parseTableLines(rescue, false),
            "status": status,
            "lastUpdate": lastUpdate,
            "lastTimeUpdate": updated.getTime()
        });
    },

    parseTableLines: function(trs, withMinValue) {
        trs = trs.map(tr => $(tr).children('td').toArray() );
        let values = trs.map(tr => tr.map(td => $(td).text()));
        return values.map(titulo => extract.tesouroObjectify(titulo, withMinValue) );
    },
    

    tesouroObjectify: function (element, withMinValue) {
        return {
            titulo: element[0],
            vencimento: element[1],
            taxaDeRendimento: this.formatMoneyToFloat(element[2]),
            valorMinimo: this.formatMoneyToFloat(withMinValue ? element[3] : '0'),
            precoUnitario: this.formatMoneyToFloat(withMinValue ? element[4] : element[3])
        }
    },

    formatMoneyToFloat: function (str) {
        return str.replace(/[\D]+/g,'').replace(/([0-9]{2})$/g, ".$1");
    }
}

module.exports = extract;
