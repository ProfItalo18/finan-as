document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos do DOM ---
    const formLancamento = document.getElementById('form-lancamento');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const dataInput = document.getElementById('data');
    const tipoSelect = document.getElementById('tipo');
    const categoriaSelect = document.getElementById('categoria');
    const tabelaLancamentosBody = document.querySelector('#tabela-lancamentos tbody');
    const totalReceitasSpan = document.getElementById('total-receitas');
    const totalDespesasSpan = document.getElementById('total-despesas');
    const totalInvestimentosSpan = document.getElementById('total-investimentos');
    const saldoMensalSpan = document.getElementById('saldo-mensal');
    const filtroMesAnoSelect = document.getElementById('filtro-mes-ano');
    const btnImprimir = document.getElementById('btn-imprimir');

    // Elementos do Scanner
    const barcodeScannerSection = document.getElementById('barcode-scanner');
    const startScannerBtn = document.getElementById('start-scanner-btn'); // Visibilidade controlada via JS
    const stopScannerBtn = document.getElementById('stop-scanner-btn');
    const closeScannerBtn = document.getElementById('close-scanner-btn');
    const barcodeResultP = document.getElementById('barcode-result');
    const scannerStatusP = document.getElementById('scanner-status');
    const openScannerBtn = document.getElementById('open-scanner-btn');

    // --- Variáveis de Estado ---
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];
    let editandoId = null;
    let scannerRunning = false;

    // --- Dados Fixos (Categorias) ---
    const categorias = {
        receita: ['Salário', 'Freelance', 'Dividendos', 'Aluguel Recebido', 'Venda de Ativos', 'Reembolso', 'Outros'],
        despesa: ['Moradia (Aluguel/Prestação)', 'Alimentação', 'Transporte', 'Lazer e Entretenimento', 'Saúde', 'Educação', 'Contas de Consumo (Água, Luz, Internet)', 'Vestuário', 'Impostos e Taxas', 'Automóvel', 'Dívidas e Empréstimos', 'Outros'],
        investimento: ['Renda Fixa (CDB, LCI/LCA)', 'Renda Variável (Ações, FIIs)', 'Fundos de Investimento', 'Previdência Privada', 'Criptomoedas', 'Tesouro Direto', 'Outros']
    };

    // --- Funções Auxiliares ---

    /**
     * Gera um ID alfanumérico aleatório de 5 caracteres.
     * @returns {string} O ID gerado.
     */
    function gerarId() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    /**
     * Formata um valor numérico para o formato de moeda BRL.
     * @param {number} valor - O valor a ser formatado.
     * @returns {string} O valor formatado.
     */
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    }

    /**
     * Tenta extrair o valor de um código de barras de boleto brasileiro (linha digitável).
     * Esta função é uma ABORDAGEM SIMPLIFICADA e pode não ser 100% precisa para
     * todos os tipos de boletos brasileiros, que seguem padrões complexos (FEBRABAN).
     * @param {string} barcode - A linha digitável do boleto (geralmente 47 ou 48 dígitos).
     * @returns {number} O valor extraído ou 0 se não for possível.
     */
    function extractValueFromBarcode(barcode) {
        // Remove caracteres não numéricos
        const cleanBarcode = barcode.replace(/\D/g, '');

        // Lógica para linha digitável de 47 ou 48 dígitos (boletos bancários brasileiros)
        if (cleanBarcode.length === 47 || cleanBarcode.length === 48) {
            // Para boletos de 47 dígitos (títulos): o valor está na posição 37-47 (10 dígitos)
            // Os 8 primeiros são inteiros, os 2 últimos são centavos
            const valorString = cleanBarcode.substring(37, 47); // Ex: "0000012345"
            if (valorString.match(/^\d{10}$/)) { // Verifica se são 10 dígitos numéricos
                const valorInteiro = parseInt(valorString.substring(0, 8), 10);
                const valorDecimal = parseInt(valorString.substring(8, 10), 10);
                return parseFloat(`${valorInteiro}.${valorDecimal}`);
            }
        }
        // Para códigos de barras de convênio (geralmente 48 dígitos, mas com DV diferente)
        // O valor pode estar em posições diferentes, dependendo do tipo de convênio.
        // Se a primeira parte não se encaixa, podemos tentar outras lógicas genéricas.
        // Exemplo: Últimos 10 dígitos como valor (alguns EANs ou Code128 podem ter essa estrutura simples)
        if (cleanBarcode.length >= 10) {
            const lastTen = cleanBarcode.substring(cleanBarcode.length - 10);
            if (lastTen.match(/^\d+$/)) { // Se for só número
                const integerPart = parseInt(lastTen.substring(0, lastTen.length - 2), 10);
                const decimalPart = parseInt(lastTen.substring(lastTen.length - 2), 10);
                return parseFloat(`${integerPart}.${decimalPart}`);
            }
        }

        console.warn("Não foi possível extrair um valor numérico válido do código de barras:", barcode);
        return 0; // Retorna 0 se não conseguir extrair um valor
    }

    // --- Gerenciamento de UI ---

    /**
     * Popula o select de categorias com base no tipo de lançamento selecionado.
     */
    function popularCategorias() {
        const tipo = tipoSelect.value;
        categoriaSelect.innerHTML = '<option value="">Selecione a Categoria</option>';
        if (tipo && categorias[tipo]) {
            categorias[tipo].forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                categoriaSelect.appendChild(option);
            });
            categoriaSelect.disabled = false;
        } else {
            categoriaSelect.disabled = true;
        }
    }

    /**
     * Popula o select de filtro de mês/ano com os meses dos lançamentos existentes.
     */
    function popularFiltroMesAno() {
        const mesesAnos = new Set();
        lancamentos.forEach(lancamento => {
            const data = new Date(lancamento.data + 'T12:00:00'); // Adiciona T12:00:00 para evitar problemas de fuso horário
            const mesAno = `${data.getFullYear()}-${(data.getMonth() + 1).toString().padStart(2, '0')}`;
            mesesAnos.add(mesAno);
        });

        filtroMesAnoSelect.innerHTML = '<option value="todos">Todos os Meses</option>';
        // Ordena do mais recente para o mais antigo
        const sortedMesesAnos = Array.from(mesesAnos).sort((a, b) => b.localeCompare(a));
        sortedMesesAnos.forEach(mesAno => {
            const [ano, mes] = mesAno.split('-');
            const dataExemplo = new Date(ano, parseInt(mes, 10) - 1, 1);
            const nomeMes = dataExemplo.toLocaleString('pt-BR', { month: 'long' });
            const option = document.createElement('option');
            option.value = mesAno;
            option.textContent = `${nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)} de ${ano}`;
            filtroMesAnoSelect.appendChild(option);
        });

        const dataAtual = new Date();
        const mesAtual = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}`;
        if (sortedMesesAnos.includes(mesAtual)) {
            filtroMesAnoSelect.value = mesAtual;
        } else {
            filtroMesAnoSelect.value = 'todos';
        }
    }

    /**
     * Renderiza os lançamentos na tabela e atualiza o resumo.
     */
    function renderizarLancamentos() {
        const filtroMesAno = filtroMesAnoSelect.value;
        tabelaLancamentosBody.innerHTML = '';
        let receitasTotal = 0;
        let despesasTotal = 0;
        let investimentosTotal = 0;

        const lancamentosFiltrados = lancamentos.filter(lancamento => {
            if (filtroMesAno === 'todos') {
                return true;
            }
            const dataLancamento = new Date(lancamento.data + 'T12:00:00');
            const mesAnoLancamento = `${dataLancamento.getFullYear()}-${(dataLancamento.getMonth() + 1).toString().padStart(2, '0')}`;
            return mesAnoLancamento === filtroMesAno;
        });

        if (lancamentosFiltrados.length === 0) {
            tabelaLancamentosBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 20px;">Nenhum lançamento encontrado para este período.</td></tr>';
        }

        lancamentosFiltrados.forEach(lancamento => {
            const row = tabelaLancamentosBody.insertRow();
            row.dataset.id = lancamento.id;

            if (lancamento.tipo === 'receita') {
                row.style.color = 'var(--accent-color)';
            } else if (lancamento.tipo === 'despesa') {
                row.style.color = 'var(--danger-color)';
            }

            const statusClass = lancamento.statusPagamento === 'pago' ? 'status-pago' : 'status-pendente';
            const dataPagamentoStr = lancamento.dataPagamento ? new Date(lancamento.dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR') : '';
            const statusText = lancamento.statusPagamento === 'pago' ? `Pago em ${dataPagamentoStr}` : 'Pendente';

            row.innerHTML = `
                <td>${lancamento.id}</td>
                <td>${new Date(lancamento.data + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td>${lancamento.descricao}</td>
                <td>${lancamento.categoria}</td>
                <td>${lancamento.tipo.charAt(0).toUpperCase() + lancamento.tipo.slice(1)}</td>
                <td>${formatarMoeda(lancamento.valor)}</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="action-buttons">
                    <button class="edit-btn" data-id="${lancamento.id}">Editar</button>
                    <button class="delete-btn" data-id="${lancamento.id}">Excluir</button>
                    ${lancamento.statusPagamento === 'pendente' ? `<button class="pay-btn" data-id="${lancamento.id}">Baixar</button>` : ''}
                </td>
            `;

            // Apenas despesas e investimentos PAGOS contam para o resumo!
            if (lancamento.tipo === 'receita') {
                receitasTotal += lancamento.valor;
            } else if (lancamento.tipo === 'despesa' && lancamento.statusPagamento === 'pago') {
                despesasTotal += lancamento.valor;
            } else if (lancamento.tipo === 'investimento' && lancamento.statusPagamento === 'pago') {
                investimentosTotal += lancamento.valor;
            }
        });
        atualizarResumo(receitasTotal, despesasTotal, investimentosTotal);
    }

    /**
     * Atualiza os valores exibidos no resumo mensal.
     * @param {number} receitas - Total de receitas.
     * @param {number} despesas - Total de despesas pagas.
     * @param {number} investimentos - Total de investimentos pagos.
     */
    function atualizarResumo(receitas, despesas, investimentos) {
        totalReceitasSpan.textContent = formatarMoeda(receitas);
        totalDespesasSpan.textContent = formatarMoeda(despesas);
        totalInvestimentosSpan.textContent = formatarMoeda(investimentos);
        const saldo = receitas - despesas - investimentos;
        saldoMensalSpan.textContent = formatarMoeda(saldo);
        saldoMensalSpan.style.color = saldo >= 0 ? 'var(--accent-color)' : 'var(--danger-color)';
    }

    // --- Funções do Scanner ---

    /**
     * Inicia o QuaggaJS scanner.
     */
    function startScanner() {
        if (scannerRunning) return;

        scannerStatusP.textContent = 'Iniciando scanner...';
        barcodeResultP.textContent = '';
        stopScannerBtn.style.display = 'none'; // Garante que o botão de parar não apareça antes de iniciar

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive.viewport'),
                constraints: {
                    width: { min: 640 },
                    height: { min: 480 },
                    aspectRatio: { min: 1, max: 100 },
                    facingMode: "environment"
                },
            },
            decoder: {
                // Leitores comuns. 'i2of5_reader' é essencial para muitos boletos.
                // A ordem pode influenciar a performance.
                readers: ["ean_reader", "code_128_reader", "code_39_reader", "i2of5_reader"]
            }
        }, function (err) {
            if (err) {
                console.error("Erro ao iniciar QuaggaJS:", err);
                scannerStatusP.textContent = `Erro ao iniciar câmera: ${err.message}. Verifique permissões.`;
                barcodeResultP.textContent = 'Certifique-se de que sua câmera está funcionando e que você concedeu as permissões.';
                scannerRunning = false;
                startScannerBtn.style.display = 'inline-block'; // Permite tentar novamente
                return;
            }
            console.log("QuaggaJS inicializado com sucesso!");
            Quagga.start();
            scannerRunning = true;
            startScannerBtn.style.display = 'none';
            stopScannerBtn.style.display = 'inline-block';
            scannerStatusP.textContent = 'Posicione o código de barras na frente da câmera.';
        });

        // Este evento é disparado repetidamente, é importante ter uma lógica para parar após a primeira detecção válida.
        Quagga.onDetected(function (result) {
            const code = result.codeResult.code;
            if (code && scannerRunning) { // Garante que o scanner ainda está ativo e que o código é válido
                console.log("Código de Barras Detectado:", code);
                decodeBarcodeAndFillForm(code);
                stopScanner(); // Para o scanner após a primeira leitura bem-sucedida
                Quagga.offDetected(); // Remove o listener para evitar múltiplas detecções
            }
        });

        // Desenha os retângulos de detecção para feedback visual
        Quagga.onProcessed(function(result) {
            const drawingCtx = Quagga.canvas.ctx.overlay;
            const drawingCanvas = Quagga.canvas.dom.overlay;

            drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.width), parseInt(drawingCanvas.height));

            if (result) {
                if (result.boxes) {
                    result.boxes.filter(function (box) {
                        return box !== result.box;
                    }).forEach(function (box) {
                        Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                    });
                }
                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
                }
                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: "red", lineWidth: 3 });
                }
            }
        });
    }

    /**
     * Para o QuaggaJS scanner.
     */
    function stopScanner() {
        if (!scannerRunning) return;
        Quagga.stop();
        scannerRunning = false;
        startScannerBtn.style.display = 'inline-block'; // Permite iniciar novamente manualmente
        stopScannerBtn.style.display = 'none';
        scannerStatusP.textContent = 'Scanner parado.';
        barcodeResultP.textContent = ''; // Limpa o resultado ao parar
        console.log("Scanner parado.");
        // Remova listeners para evitar chamadas duplicadas se o scanner for reiniciado
        Quagga.offDetected();
        Quagga.offProcessed();
    }

    /**
     * Decodifica o código de barras, extrai informações e preenche o formulário.
     * @param {string} code - O código de barras decodificado.
     */
    function decodeBarcodeAndFillForm(code) {
        barcodeResultP.textContent = `Código Lido: ${code}`;
        scannerStatusP.textContent = 'Código de barras lido com sucesso! Preenchendo formulário...';

        const valorLido = extractValueFromBarcode(code);

        // Preenche os campos do formulário
        descricaoInput.value = `Despesa - Boleto #${code.substring(code.length - 8)}`; // Usa parte final do código como ref
        valorInput.value = valorLido.toFixed(2);
        tipoSelect.value = 'despesa';
        popularCategorias(); // Popula categorias para despesa
        
        // Tenta selecionar uma categoria comum para despesas de boleto
        // Ajuste a lógica de seleção de categoria conforme suas necessidades
        const suggestedCategories = [
            'Contas de Consumo (Água, Luz, Internet)',
            'Dívidas e Empréstimos',
            'Impostos e Taxas',
            'Outros'
        ];
        let categoryFound = false;
        for (const cat of suggestedCategories) {
            if (Array.from(categoriaSelect.options).some(opt => opt.value === cat)) {
                categoriaSelect.value = cat;
                categoryFound = true;
                break;
            }
        }
        if (!categoryFound && Array.from(categoriaSelect.options).some(opt => opt.value === 'Outros')) {
            categoriaSelect.value = 'Outros';
        }
        
        dataInput.valueAsDate = new Date(); // Data atual como data da despesa

        // Volta para a seção de lançamentos após um pequeno atraso para o usuário ver o resultado
        setTimeout(() => {
            barcodeScannerSection.classList.add('scanner-hidden');
            document.getElementById('lancamentos').style.display = 'block';
            scannerStatusP.textContent = ''; // Limpa status
            barcodeResultP.textContent = ''; // Limpa resultado
        }, 1500); // 1.5 segundos de atraso
    }

    // --- Manipulação de Eventos ---

    // Evento de submissão do formulário de lançamento
    formLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const novoLancamento = {
            descricao: descricaoInput.value,
            valor: parseFloat(valorInput.value),
            data: dataInput.value, // Data no formato YYYY-MM-DD
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            statusPagamento: 'pendente', // Sempre começa como pendente
            dataPagamento: null
        };

        if (editandoId) {
            lancamentos = lancamentos.map(lanc => {
                if (lanc.id === editandoId) {
                    // Mantém status de pagamento e data de pagamento existentes ao editar
                    return { ...novoLancamento, id: lanc.id, statusPagamento: lanc.statusPagamento, dataPagamento: lanc.dataPagamento };
                }
                return lanc;
            });
            editandoId = null;
            formLancamento.querySelector('button[type="submit"]').textContent = 'Adicionar Lançamento';
        } else {
            novoLancamento.id = gerarId();
            lancamentos.push(novoLancamento);
        }

        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
        formLancamento.reset();
        popularCategorias();
        popularFiltroMesAno();
        renderizarLancamentos();
    });

    // Eventos para botões de ação na tabela (editar, excluir, baixar)
    tabelaLancamentosBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const lancamentoParaEditar = lancamentos.find(lanc => lanc.id === id);
            if (lancamentoParaEditar) {
                descricaoInput.value = lancamentoParaEditar.descricao;
                valorInput.value = lancamentoParaEditar.valor;
                dataInput.value = lancamentoParaEditar.data;
                tipoSelect.value = lancamentoParaEditar.tipo;
                popularCategorias(); // Popula categorias antes de setar
                categoriaSelect.value = lancamentoParaEditar.categoria;

                editandoId = id;
                formLancamento.querySelector('button[type="submit"]').textContent = 'Salvar Edição';
                document.getElementById('lancamentos').scrollIntoView({ behavior: 'smooth' });
            }
        } else if (target.classList.contains('delete-btn')) {
            if (confirm('Tem certeza que deseja excluir este lançamento?')) {
                lancamentos = lancamentos.filter(lanc => lanc.id !== id);
                localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
                popularFiltroMesAno();
                renderizarLancamentos();
            }
        } else if (target.classList.contains('pay-btn')) {
            const lancamentoParaBaixar = lancamentos.find(lanc => lanc.id === id);
            if (lancamentoParaBaixar && lancamentoParaBaixar.statusPagamento === 'pendente') {
                lancamentoParaBaixar.statusPagamento = 'pago';
                // Define a data de pagamento como o dia atual no formato YYYY-MM-DD
                lancamentoParaBaixar.dataPagamento = new Date().toISOString().split('T')[0];
                localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
                renderizarLancamentos();
            }
        }
    });

    // Eventos de mudança para selects de filtro e tipo
    tipoSelect.addEventListener('change', popularCategorias);
    filtroMesAnoSelect.addEventListener('change', renderizarLancamentos);

    // Evento do botão de imprimir
    btnImprimir.addEventListener('click', () => {
        window.print();
    });

    // --- Eventos do Scanner ---
    openScannerBtn.addEventListener('click', () => {
        document.getElementById('lancamentos').style.display = 'none'; // Esconde o formulário
        barcodeScannerSection.classList.remove('scanner-hidden'); // Mostra a seção do scanner
        startScanner(); // Inicia o scanner automaticamente
    });

    // Os botões start/stop são controlados principalmente internamente pela lógica do scanner.
    // startScannerBtn.addEventListener('click', startScanner); // Pode ser útil para reiniciar manualmente após erro
    stopScannerBtn.addEventListener('click', stopScanner);

    closeScannerBtn.addEventListener('click', () => {
        stopScanner(); // Garante que o scanner pare
        barcodeScannerSection.classList.add('scanner-hidden'); // Esconde a seção do scanner
        document.getElementById('lancamentos').style.display = 'block'; // Mostra o formulário de lançamento
    });


    // --- Inicialização da Aplicação ---
    function initializeApp() {
        popularCategorias();
        popularFiltroMesAno();
        renderizarLancamentos();
        // Garante que o formulário de lançamento está visível e o scanner oculto ao carregar a página
        document.getElementById('lancamentos').style.display = 'block';
        barcodeScannerSection.classList.add('scanner-hidden');
    }

    initializeApp();
});