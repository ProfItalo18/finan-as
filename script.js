document.addEventListener('DOMContentLoaded', () => {
    // --- Referências aos Elementos do DOM ---
    const btnLancamento = document.getElementById('btnLancamento');
    const btnResumo = document.getElementById('btnResumo');
    const btnHistorico = document.getElementById('btnHistorico');

    const lancamentoSection = document.getElementById('lancamentoSection');
    const resumoSection = document.getElementById('resumoSection');
    const historicoSection = document.getElementById('historicoSection');

    const formLancamento = document.getElementById('formLancamento');
    const tipoSelect = document.getElementById('tipo');
    const categoriaSelect = document.getElementById('categoria');
    const descricaoInput = document.getElementById('descricao');
    const valorInput = document.getElementById('valor');
    const dataVencimentoInput = document.getElementById('dataVencimento');
    const codigoBarrasInput = document.getElementById('codigoBarras'); // Campo de input para o código de barras

    // Novo botão para ativar o leitor via câmera
    const btnAtivarLeitorCamera = document.getElementById('btnAtivarLeitorCamera');

    const tabelaHistoricoBody = document.querySelector('#tabelaHistorico tbody');
    const resumoContainer = document.getElementById('resumoContainer');
    const mesFiltro = document.getElementById('mesFiltro');
    const btnFiltrarHistorico = document.getElementById('btnFiltrarHistorico');
    const btnPrintHistorico = document.getElementById('btnPrintHistorico');

    // Elementos do Modal de Edição
    const editModal = document.getElementById('editModal');
    const closeButton = editModal.querySelector('.close-button');
    const formEditLancamento = document.getElementById('formEditLancamento');
    const editId = document.getElementById('editId');
    const editTipo = document.getElementById('editTipo');
    const editCategoria = document.getElementById('editCategoria');
    const editDescricao = document.getElementById('editDescricao');
    const editValor = document.getElementById('editValor');
    const editDataVencimento = document.getElementById('editDataVencimento');
    const editStatus = document.getElementById('editStatus');

    // Elemento para o feedback do usuário (TOAST)
    const feedbackToast = document.getElementById('feedbackToast');

    // --- Elementos do Scanner de Código de Barras (Câmera) ---
    const scannerModal = document.getElementById('scannerModal');
    const closeButtonScanner = scannerModal.querySelector('.close-button-scanner');
    const videoScanner = document.getElementById('videoScanner');
    const scannerResult = document.getElementById('scannerResult');
    const btnCancelarScanner = document.getElementById('btnCancelarScanner');

    // Instância do leitor de código de barras (ZXing-JS)
    let codeReader = null; // Será inicializado quando o scanner for aberto
    let isScanning = false; // Flag para controlar o estado do scanner

    // --- Armazenamento de Dados ---
    let lancamentos = JSON.parse(localStorage.getItem('lancamentos')) || [];

    // --- Categorias Pré-definidas ---
    const categorias = {
        receita: ['Salário', 'Freelance', 'Vendas', 'Aluguel Recebido', 'Rendimento de Investimentos', 'Presente/Doação', 'Reembolso', 'Outras Receitas'],
        despesa: ['Moradia', 'Alimentação', 'Transporte', 'Lazer', 'Educação', 'Saúde', 'Contas', 'Vestuário', 'Cuidados Pessoais', 'Outras Despesas'],
        investimento: ['Ações', 'Fundos de Investimento', 'Renda Fixa', 'Criptomoedas', 'Previdência Privada', 'Imóveis', 'Poupança', 'Outros Investimentos']
    };

    // --- Produtos Mock (para simular leitura de código de barras) ---
    // Estes dados seriam normalmente buscados de um banco de dados ou API
    const produtosMock = [
        { codigo: '7891234567890', nome: 'Pacote de Arroz 5kg', preco: 25.50, categoria: 'Alimentação', tipo: 'despesa' },
        { codigo: '9876543210987', nome: 'Livro "Dom Casmurro"', preco: 45.00, categoria: 'Educação', tipo: 'despesa' },
        { codigo: '1122334455667', nome: 'Serviço de Manutenção - PC', preco: 150.00, categoria: 'Outras Despesas', tipo: 'despesa' },
        { codigo: '2233445566778', nome: 'Camiseta Básica', preco: 39.90, categoria: 'Vestuário', tipo: 'despesa' },
        { codigo: '3344556677889', nome: 'Leite Integral 1L', preco: 5.20, categoria: 'Alimentação', tipo: 'despesa' },
        { codigo: '4455667788990', nome: 'Consulta Médica', preco: 200.00, categoria: 'Saúde', tipo: 'despesa' },
        { codigo: '5566778899001', nome: 'Mensalidade Academia', preco: 80.00, categoria: 'Lazer', tipo: 'despesa' },
        { codigo: '6677889900112', nome: 'Licença de Software', preco: 120.00, categoria: 'Educação', tipo: 'despesa' },
        { codigo: '7788990011223', nome: 'Rendimento CDB', preco: 75.00, categoria: 'Rendimento de Investimentos', tipo: 'receita' },
        { codigo: '8899001122334', nome: 'Devolução de Compra', preco: 55.00, categoria: 'Reembolso', tipo: 'receita' },
    ];


    // --- Funções Auxiliares Comuns ---

    /**
     * Gera um ID alfanumérico aleatório.
     * @returns {string} ID gerado.
     */
    function generateId() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    /**
     * Alterna a visibilidade das seções da página.
     * @param {HTMLElement} sectionToShow - A seção HTML a ser exibida.
     */
    function showSection(sectionToShow) {
        document.querySelectorAll('section').forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
        sectionToShow.classList.remove('hidden');
        sectionToShow.classList.add('active');
    }

    /**
     * Exibe uma mensagem de feedback (toast) para o usuário.
     * @param {string} message - A mensagem a ser exibida.
     * @param {string} type - Tipo de feedback ('info', 'success', 'warning', 'error').
     */
    function showFeedback(message, type = 'info') {
        if (!feedbackToast) {
            alert(message); // Fallback caso o toast não esteja disponível
            return;
        }
        feedbackToast.textContent = message;
        feedbackToast.className = `toast show ${type}`; // Adiciona classes para mostrar e estilizar
        setTimeout(() => {
            feedbackToast.className = feedbackToast.className.replace("show", ""); // Esconde após 3 segundos
        }, 3000);
    }

    /**
     * Preenche um <select> de categorias com base no tipo de transação.
     * @param {HTMLSelectElement} selectElement - O elemento <select> de categorias.
     * @param {string} selectedType - O tipo de transação (ex: 'receita', 'despesa').
     * @param {string} [selectedCategory=''] - Categoria a ser pré-selecionada (opcional).
     */
    function loadCategories(selectElement, selectedType, selectedCategory = '') {
        selectElement.innerHTML = '<option value="">Selecione</option>'; // Limpa e adiciona opção padrão
        if (selectedType && categorias[selectedType]) {
            categorias[selectedType].forEach(categoria => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                if (categoria === selectedCategory) {
                    option.selected = true; // Seleciona a categoria se corresponder
                }
                selectElement.appendChild(option);
            });
        }
    }

    // Carrega categorias quando o tipo de transação muda
    tipoSelect.addEventListener('change', () => {
        loadCategories(categoriaSelect, tipoSelect.value);
    });

    // --- Lógica de Adição de Lançamento ---

    formLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        // Validação básica dos campos do formulário
        const descricaoValue = descricaoInput.value.trim();
        const valorValue = parseFloat(valorInput.value);
        const dataVencimentoValue = dataVencimentoInput.value;

        if (!tipoSelect.value || !categoriaSelect.value || !descricaoValue || isNaN(valorValue) || valorValue <= 0 || !dataVencimentoValue) {
            showFeedback('Por favor, preencha todos os campos obrigatórios (Tipo, Categoria, Descrição, Valor > 0, Data de Vencimento).', 'warning');
            return;
        }

        // Cria o objeto de lançamento
        const novoLancamento = {
            id: generateId(),
            tipo: tipoSelect.value,
            categoria: categoriaSelect.value,
            descricao: descricaoValue,
            valor: valorValue,
            dataVencimento: dataVencimentoValue,
            dataPagamento: null, // Inicialmente nulo
            status: 'Pendente'   // Inicialmente pendente
        };

        // Adiciona ao array e salva no Local Storage
        lancamentos.push(novoLancamento);
        localStorage.setItem('lancamentos', JSON.stringify(lancamentos));

        showFeedback('Lançamento adicionado com sucesso!', 'success');
        formLancamento.reset(); // Limpa o formulário
        categoriaSelect.innerHTML = '<option value="">Selecione o tipo primeiro</option>'; // Reseta a categoria
        codigoBarrasInput.value = ''; // Limpa o campo de código de barras

        // Atualiza as visualizações
        renderHistorico(mesFiltro.value);
        renderResumo();
    });

    // --- Lógica de Leitura de Código de Barras (Digitação ou Leitor USB) ---
    // Este listener processa o código de barras digitado manualmente ou por um leitor USB que emula teclado.
    if (codigoBarrasInput) {
        codigoBarrasInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Impede o envio do formulário
                const codigoLido = codigoBarrasInput.value.trim();
                handleBarcodeScan(codigoLido); // Chama a função unificada de processamento
            }
        });
    }

    // --- Lógica do Scanner de Código de Barras (Câmera com ZXing-JS) ---

    // Evento para ativar o leitor da câmera
    btnAtivarLeitorCamera.addEventListener('click', () => {
        if (!codeReader) {
            // Inicializa o leitor ZXing-JS apenas uma vez
            codeReader = new ZXing.BrowserMultiFormatReader();
        }

        // Exibe o modal do scanner
        scannerModal.style.display = 'flex';
        scannerResult.textContent = 'Aguardando leitura...';
        isScanning = true; // Define o estado de escaneamento como ativo

        // Lista os dispositivos de vídeo disponíveis (câmeras)
        codeReader.listVideoInputDevices()
            .then((videoInputDevices) => {
                if (videoInputDevices.length > 0) {
                    // Lógica para escolher a câmera:
                    // 1. Tenta encontrar uma câmera traseira (environment)
                    // 2. Caso contrário, usa a primeira câmera disponível
                    const preferredDeviceId = videoInputDevices.find(
                        device => device.label.toLowerCase().includes('back') || device.kind === 'environment'
                    )?.deviceId || videoInputDevices[0].deviceId;

                    // Inicia a decodificação do stream de vídeo da câmera selecionada
                    codeReader.decodeFromVideoDevice(preferredDeviceId, videoScanner, (result, err) => {
                        if (isScanning && result) { // Verifica se ainda estamos escaneando e se um código foi lido
                            console.log('Código de barras lido via câmera:', result.text);
                            scannerResult.textContent = `Lido: ${result.text}`;
                            handleBarcodeScan(result.text); // Processa o código lido
                            stopScanner(); // Para o scanner após a leitura bem-sucedida
                        }

                        // Ignora erros de "not found" (código não detectado) para continuar tentando
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            console.error('Erro no scanner:', err);
                            scannerResult.textContent = 'Erro ao ler código. Tente novamente.';
                            showFeedback(`Erro ao ativar leitor: ${err.message}`, 'error');
                            stopScanner(); // Para o scanner em caso de erro grave (não apenas "não encontrado")
                        }
                    });
                } else {
                    // Se nenhuma câmera for encontrada
                    showFeedback('Nenhuma câmera encontrada para leitura de código de barras.', 'warning');
                    stopScanner(); // Fecha o modal
                }
            })
            .catch((err) => {
                // Erro ao acessar dispositivos (ex: permissão negada, câmera indisponível)
                console.error('Erro ao acessar dispositivos de vídeo:', err);
                scannerResult.textContent = 'Erro ao acessar a câmera. Verifique as permissões.';
                showFeedback(`Não foi possível acessar a câmera. Por favor, conceda permissão ou verifique se outra aplicação está usando-a: ${err.message}`, 'error');
                stopScanner(); // Fecha o modal em caso de erro
            });
    });

    /**
     * Para o scanner da câmera e fecha o modal.
     */
    function stopScanner() {
        if (codeReader && isScanning) {
            codeReader.reset(); // Reseta o leitor e para o stream da câmera
            isScanning = false;
            scannerModal.style.display = 'none'; // Esconde o modal do scanner
            console.log('Scanner parado.');
        }
    }

    // Eventos para fechar/cancelar o scanner
    closeButtonScanner.addEventListener('click', stopScanner); // Botão 'X'
    btnCancelarScanner.addEventListener('click', stopScanner); // Botão "Cancelar Leitura"
    // Fecha o modal se o usuário clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === scannerModal) {
            stopScanner();
        }
    });

    /**
     * Lógica unificada para processar um código de barras lido (seja por câmera ou digitação).
     * @param {string} codigoLido - O código de barras que foi lido/digitado.
     */
    function handleBarcodeScan(codigoLido) {
        if (!codigoLido) {
            showFeedback('Código de barras vazio.', 'warning');
            return;
        }

        // Tenta encontrar o produto no mock de dados
        const produtoEncontrado = produtosMock.find(p => p.codigo === codigoLido);

        if (produtoEncontrado) {
            // Preenche os campos do formulário com os dados do produto
            tipoSelect.value = produtoEncontrado.tipo;
            loadCategories(categoriaSelect, produtoEncontrado.tipo, produtoEncontrado.categoria);
            descricaoInput.value = produtoEncontrado.nome;
            valorInput.value = produtoEncontrado.preco.toFixed(2); // Formata para 2 casas decimais

            showFeedback(`Produto "${produtoEncontrado.nome}" encontrado e campos preenchidos!`, 'info');
        } else {
            // Se o produto não for encontrado, preenche apenas o código e sugere preenchimento manual
            descricaoInput.value = `Item - Cód: ${codigoLido}`;
            valorInput.value = ''; // Limpa o valor para o usuário preencher
            showFeedback('Código de barras não encontrado nos registros. Por favor, ajuste a descrição e outros campos.', 'warning');
        }
        codigoBarrasInput.value = codigoLido; // Preenche o campo de input visível
        descricaoInput.focus(); // Move o foco para a descrição para o usuário continuar o preenchimento
    }

    // --- Lógica de Renderização da Tabela de Histórico ---

    /**
     * Renderiza a tabela de histórico de lançamentos, aplicando filtro por mês se especificado.
     * @param {string|null} filtroMes - Mês no formato 'YYYY-MM' ou null para todos.
     */
    function renderHistorico(filtroMes = null) {
        tabelaHistoricoBody.innerHTML = ''; // Limpa a tabela

        let lancamentosFiltrados = lancamentos;
        if (filtroMes) {
            // Filtra os lançamentos pelo ano e mês
            lancamentosFiltrados = lancamentos.filter(lanc => {
                const dataVencimento = new Date(lanc.dataVencimento + 'T00:00:00'); // Garante fuso horário correto
                const [anoFiltro, mesFiltroNum] = filtroMes.split('-');
                return dataVencimento.getFullYear() === parseInt(anoFiltro) &&
                       (dataVencimento.getMonth() + 1) === parseInt(mesFiltroNum);
            });
        }

        // Ordena os lançamentos por data de vencimento e status
        lancamentosFiltrados.sort((a, b) => {
            const dateA = new Date(a.dataVencimento);
            const dateB = new Date(b.dataVencimento);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB; // Ordena por data
            }
            // Se as datas forem iguais, "Pendente" vem antes de "Pago"
            if (a.status === 'Pendente' && b.status === 'Pago') return -1;
            if (a.status === 'Pago' && b.status === 'Pendente') return 1;
            return 0;
        });

        // Exibe mensagem se não houver lançamentos filtrados
        if (lancamentosFiltrados.length === 0) {
            tabelaHistoricoBody.innerHTML = '<tr><td colspan="9">Nenhum lançamento encontrado para este período.</td></tr>';
            return;
        }

        // Popula a tabela com os lançamentos
        lancamentosFiltrados.forEach(lanc => {
            const row = tabelaHistoricoBody.insertRow();
            row.dataset.id = lanc.id; // Armazena o ID no dataset da linha

            const statusClass = lanc.status === 'Pago' ? 'status-pago' : 'status-pendente';
            const dataPagamentoFormatada = lanc.dataPagamento ? new Date(lanc.dataPagamento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
            const dataVencimentoFormatada = new Date(lanc.dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR');


            row.innerHTML = `
                <td data-label="ID:">${lanc.id}</td>
                <td data-label="Tipo:">${lanc.tipo.charAt(0).toUpperCase() + lanc.tipo.slice(1)}</td>
                <td data-label="Categoria:">${lanc.categoria}</td>
                <td data-label="Descrição:">${lanc.descricao}</td>
                <td data-label="Valor:">${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td data-label="Vencimento:">${dataVencimentoFormatada}</td>
                <td data-label="Pagamento:">${dataPagamentoFormatada}</td>
                <td data-label="Status:" class="${statusClass}">${lanc.status}</td>
                <td data-label="Ações:">
                    <button class="acao-btn editar" data-id="${lanc.id}">Editar</button>
                    <button class="acao-btn excluir" data-id="${lanc.id}">Excluir</button>
                    ${lanc.status === 'Pendente' ? `<button class="acao-btn baixar" data-id="${lanc.id}">Baixar</button>` : ''}
                </td>
            `;
        });
    }

    // --- Lógica de Renderização do Resumo Mensal ---

    /**
     * Calcula e exibe o resumo financeiro para o mês atual.
     */
    function renderResumo() {
        resumoContainer.innerHTML = ''; // Limpa o conteúdo anterior

        const dataAtual = new Date();
        const anoAtual = dataAtual.getFullYear();
        const mesAtual = dataAtual.getMonth(); // Mês é zero-based (0-11)

        // Filtra lançamentos do mês atual
        const lancamentosDoMes = lancamentos.filter(lanc => {
            const dataVencimento = new Date(lanc.dataVencimento + 'T00:00:00');
            return dataVencimento.getFullYear() === anoAtual && dataVencimento.getMonth() === mesAtual;
        });

        let totalReceitas = 0;
        let totalDespesas = 0;
        let totalInvestimentos = 0;

        // Soma os valores por tipo
        lancamentosDoMes.forEach(lanc => {
            if (lanc.tipo === 'receita') {
                totalReceitas += lanc.valor;
            } else if (lanc.tipo === 'despesa') {
                totalDespesas += lanc.valor;
            } else if (lanc.tipo === 'investimento') {
                totalInvestimentos += lanc.valor;
            }
        });

        const saldoMensal = totalReceitas - totalDespesas;

        // Renderiza o resumo principal
        resumoContainer.innerHTML = `
            <h3>Mês de ${dataAtual.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
            <p><strong>Total de Receitas:</strong> ${totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Total de Despesas:</strong> ${totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Total de Investimentos:</strong> ${totalInvestimentos.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p><strong>Saldo Mensal:</strong> <span style="color: ${saldoMensal >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)'};">${saldoMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></p>
            <hr>
            <h4>Despesas por Categoria:</h4>
            <ul id="detalhesDespesas"></ul>
            <h4>Receitas por Categoria:</h4>
            <ul id="detalhesReceitas"></ul>
            <h4>Investimentos Detalhados:</h4>
            <ul id="detalhesInvestimentos"></ul>
        `;

        // Popula as listas de detalhes por categoria
        const detalhesDespesas = document.getElementById('detalhesDespesas');
        const detalhesReceitas = document.getElementById('detalhesReceitas');
        const detalhesInvestimentos = document.getElementById('detalhesInvestimentos');

        // Despesas
        const despesasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'despesa').forEach(lanc => {
            despesasPorCategoria[lanc.categoria] = (despesasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(despesasPorCategoria).length === 0) {
            detalhesDespesas.innerHTML = '<li>Nenhuma despesa registrada neste mês.</li>';
        } else {
            Object.entries(despesasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesDespesas.appendChild(li);
            });
        }

        // Receitas
        const receitasPorCategoria = {};
        lancamentosDoMes.filter(l => l.tipo === 'receita').forEach(lanc => {
            receitasPorCategoria[lanc.categoria] = (receitasPorCategoria[lanc.categoria] || 0) + lanc.valor;
        });
        if (Object.keys(receitasPorCategoria).length === 0) {
            detalhesReceitas.innerHTML = '<li>Nenhuma receita registrada neste mês.</li>';
        } else {
            Object.entries(receitasPorCategoria).sort(([, a], [, b]) => b - a).forEach(([categoria, valor]) => {
                const li = document.createElement('li');
                li.textContent = `${categoria}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesReceitas.appendChild(li);
            });
        }

        // Investimentos
        const investimentosDoMes = lancamentosDoMes.filter(l => l.tipo === 'investimento');
        if (investimentosDoMes.length === 0) {
            detalhesInvestimentos.innerHTML = '<li>Nenhum investimento registrado neste mês.</li>';
        } else {
            investimentosDoMes.sort((a, b) => b.valor - a.valor).forEach(lanc => {
                const li = document.createElement('li');
                li.textContent = `${lanc.categoria} - ${lanc.descricao}: ${lanc.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
                detalhesInvestimentos.appendChild(li);
            });
        }
    }

    // --- Lógica de Ações da Tabela (Editar, Excluir, Baixar) ---

    // Delegação de eventos para botões na tabela do histórico
    tabelaHistoricoBody.addEventListener('click', (e) => {
        const target = e.target;
        const id = target.dataset.id; // Pega o ID do dataset do botão clicado

        if (!id) return; // Se não tiver ID, ignora

        if (target.classList.contains('editar')) {
            editLancamento(id);
        } else if (target.classList.contains('excluir')) {
            deleteLancamento(id);
        } else if (target.classList.contains('baixar')) {
            markAsPaid(id);
        }
    });

    /**
     * Abre o modal de edição e preenche com os dados do lançamento.
     * @param {string} id - O ID do lançamento a ser editado.
     */
    function editLancamento(id) {
        const lancamentoToEdit = lancamentos.find(lanc => lanc.id === id);
        if (!lancamentoToEdit) {
            showFeedback('Lançamento não encontrado para edição.', 'error');
            return;
        }

        // Preenche os campos do modal de edição
        editId.value = lancamentoToEdit.id;
        editTipo.value = lancamentoToEdit.tipo; // Tipo é desabilitado para edição
        loadCategories(editCategoria, lancamentoToEdit.tipo, lancamentoToEdit.categoria); // Carrega e seleciona categoria
        editDescricao.value = lancamentoToEdit.descricao;
        editValor.value = lancamentoToEdit.valor;
        editDataVencimento.value = lancamentoToEdit.dataVencimento;
        editStatus.value = lancamentoToEdit.status;

        editModal.style.display = 'flex'; // Exibe o modal
    }

    // Lógica para salvar as edições do lançamento
    formEditLancamento.addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editId.value;
        const lancamentoIndex = lancamentos.findIndex(lanc => lanc.id === id);

        if (lancamentoIndex === -1) {
            showFeedback('Erro: Lançamento não encontrado para atualização.', 'error');
            return;
        }

        // Validação dos campos do formulário de edição
        const editDescricaoValue = editDescricao.value.trim();
        const editValorValue = parseFloat(editValor.value);
        const editDataVencimentoValue = editDataVencimento.value;

        if (!editCategoria.value || !editDescricaoValue || isNaN(editValorValue) || editValorValue <= 0 || !editDataVencimentoValue) {
            showFeedback('Por favor, preencha todos os campos do formulário de edição corretamente.', 'warning');
            return;
        }

        const previousStatus = lancamentos[lancamentoIndex].status;

        // Atualiza os dados do lançamento no array
        lancamentos[lancamentoIndex].categoria = editCategoria.value;
        lancamentos[lancamentoIndex].descricao = editDescricaoValue;
        lancamentos[lancamentoIndex].valor = editValorValue;
        lancamentos[lancamentoIndex].dataVencimento = editDataVencimentoValue;
        lancamentos[lancamentoIndex].status = editStatus.value;

        // Atualiza a data de pagamento se o status mudar para 'Pago' ou for revertido
        if (lancamentos[lancamentoIndex].status === 'Pago' && !lancamentos[lancamentoIndex].dataPagamento) {
            lancamentos[lancamentoIndex].dataPagamento = new Date().toISOString().split('T')[0];
        } else if (lancamentos[lancamentoIndex].status === 'Pendente' && previousStatus === 'Pago') {
            lancamentos[lancamentoIndex].dataPagamento = null;
        }

        localStorage.setItem('lancamentos', JSON.stringify(lancamentos)); // Salva no Local Storage
        showFeedback('Lançamento atualizado com sucesso!', 'success');
        editModal.style.display = 'none'; // Esconde o modal

        // Atualiza as visualizações
        renderHistorico(mesFiltro.value);
        renderResumo();
    });

    /**
     * Exclui um lançamento do Local Storage.
     * @param {string} id - O ID do lançamento a ser excluído.
     */
    function deleteLancamento(id) {
        if (confirm('Tem certeza que deseja excluir este lançamento? Esta ação é irreversível.')) {
            lancamentos = lancamentos.filter(lanc => lanc.id !== id); // Remove o lançamento
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos)); // Salva
            showFeedback('Lançamento excluído com sucesso!', 'success');
            // Atualiza as visualizações
            renderHistorico(mesFiltro.value);
            renderResumo();
        }
    }

    /**
     * Marca um lançamento como 'Pago' e registra a data de pagamento.
     * @param {string} id - O ID do lançamento a ser marcado como pago.
     */
    function markAsPaid(id) {
        const lancamentoToMark = lancamentos.find(lanc => lanc.id === id);
        if (lancamentoToMark && lancamentoToMark.status === 'Pendente') {
            lancamentoToMark.status = 'Pago';
            lancamentoToMark.dataPagamento = new Date().toISOString().split('T')[0]; // Data de hoje
            localStorage.setItem('lancamentos', JSON.stringify(lancamentos));
            showFeedback('Lançamento baixado (pago) com sucesso!', 'success');
            // Atualiza as visualizações
            renderHistorico(mesFiltro.value);
            renderResumo();
        } else if (lancamentoToMark && lancamentoToMark.status === 'Pago') {
            showFeedback('Este lançamento já está marcado como pago.', 'info');
        }
    }

    // --- Eventos de Navegação entre Seções ---

    btnLancamento.addEventListener('click', () => showSection(lancamentoSection));
    btnResumo.addEventListener('click', () => {
        showSection(resumoSection);
        renderResumo(); // Renderiza o resumo ao ativar a seção
    });
    btnHistorico.addEventListener('click', () => {
        showSection(historicoSection);
        // Define o filtro do mês para o mês atual ao abrir o histórico
        const hoje = new Date();
        const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
        mesFiltro.value = mesAtualFormatado;
        renderHistorico(mesAtualFormatado); // Renderiza o histórico com o filtro do mês atual
    });

    // --- Eventos de Filtro e Impressão do Histórico ---

    btnFiltrarHistorico.addEventListener('click', () => {
        renderHistorico(mesFiltro.value); // Aplica o filtro selecionado
    });

    btnPrintHistorico.addEventListener('click', () => {
        // Clona a tabela para manipular para impressão
        const tabelaOriginal = document.getElementById('tabelaHistorico');
        const tabelaParaImprimir = tabelaOriginal.cloneNode(true);
        
        // Remove a coluna e os botões de "Ações" para impressão
        let acoesIndex = -1;
        const headers = Array.from(tabelaParaImprimir.querySelectorAll('th'));
        headers.forEach((th, index) => {
            if (th.textContent.trim() === 'Ações') {
                acoesIndex = index;
            }
        });

        if (acoesIndex !== -1) {
            headers[acoesIndex].remove(); // Remove o cabeçalho "Ações"
            Array.from(tabelaParaImprimir.querySelectorAll('tbody tr')).forEach(row => {
                if (row.cells[acoesIndex]) {
                    row.cells[acoesIndex].remove(); // Remove a célula "Ações" de cada linha
                }
            });
        }
        
        // Remove atributos data-label e classes para garantir a formatação de impressão
        tabelaParaImprimir.querySelectorAll('td, th, tr').forEach(el => {
            if (el.tagName === 'TD' && el.hasAttribute('data-label')) {
                el.removeAttribute('data-label');
            }
            el.style.cssText = ''; // Limpa estilos inline
            if (el.tagName === 'TD') {
                el.classList.add('no-pseudo'); // Adiciona classe para CSS de impressão
            }
        });
        
        // Garante que o thead esteja visível para impressão (caso o CSS o esconda em mobile)
        if (tabelaParaImprimir.querySelector('thead')) {
            tabelaParaImprimir.querySelector('thead').style.display = '';
        }

        // Abre uma nova janela para impressão
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Planilha Financeira</title>');
        // Adiciona estilos específicos para impressão
        printWindow.document.write('<style>');
        printWindow.document.write(`
            @media print {
                td.no-pseudo::before {
                    content: none !important; /* Desativa pseudo-elementos em mobile para impressão */
                }
            }
            body { font-family: 'Lato', sans-serif; margin: 20px; color: #343A40; }
            h1 { color: #0A387E; font-family: 'Poppins', sans-serif; font-size: 2em;}
            p { color: #6C757D; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #0A387E; color: white; font-weight: 600; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .status-pago { color: #28a745; font-weight: bold; }
            .status-pendente { color: #dc3545; font-weight: bold; }
        `);
        printWindow.document.write('</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write('<h1>Planilha de Lançamentos Financeiros</h1>');
        // Adiciona informações sobre o período filtrado
        if (mesFiltro.value) {
            const [ano, mes] = mesFiltro.value.split('-');
            const dataFiltro = new Date(parseInt(ano), parseInt(mes) - 1, 1);
            printWindow.document.write(`<p><strong>Mês de Referência:</strong> ${dataFiltro.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>`);
        } else {
            printWindow.document.write('<p><strong>Período:</strong> Todos os Lançamentos</p>');
        }
        printWindow.document.write(tabelaParaImprimir.outerHTML); // Adiciona a tabela ao corpo da janela de impressão
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print(); // Abre a caixa de diálogo de impressão
    });

    // --- Eventos de Abertura/Fechamento do Modal de Edição ---
    closeButton.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Fecha o modal se o usuário clicar fora dele
    window.addEventListener('click', (event) => {
        if (event.target === editModal) {
            editModal.style.display = 'none';
        }
    });

    // --- Inicialização da Aplicação ---
    // Define o mês inicial do filtro de histórico para o mês atual e carrega as visualizações
    const hoje = new Date();
    const mesAtualFormatado = `${hoje.getFullYear()}-${(hoje.getMonth() + 1).toString().padStart(2, '0')}`;
    mesFiltro.value = mesAtualFormatado;

    showSection(lancamentoSection); // Começa na seção de novo lançamento
    renderHistorico(mesAtualFormatado); // Renderiza o histórico com o filtro do mês atual
    renderResumo(); // Renderiza o resumo mensal inicial
});