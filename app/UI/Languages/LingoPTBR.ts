// Create new Lingo
var ptbr = new Lingo();
ptbr.ids = ["pt", "pt-br"]
ptbr.name = "Português - Brasil";
ptbr.shortname = "Português";


// Login Screen
ptbr.setLingo("_LOGINEMAIL_", "E-mail");
ptbr.setLingo("_LOGINPASSWORD_", "Senha");
ptbr.setLingo("_LOGINSUBMIT_", "Entrar");

// Changelog
ptbr.setLingo("_CHANGELOGTITLE_", "Histórico de mudanças");
ptbr.setLingo("_CHANGELOGP1_", "Para receber os updates marcados em vermelho você precisa atualizar sua aplicação para a última versão.");
ptbr.setLingo("_CHANGELOGP2_", "Compatibilidade com versões anteriores não é intencional. Não existem garantias de que versões desatualizadas funcionem e é recomendável sempre utilizar a versão mais recente do aplicativo.");
ptbr.setLingo("_CHANGELOGCURRENTVERSION_", "A sua versão é");
ptbr.setLingo("_CHANGELOGMOSTRECENTVERSION_", "A versão mais recente é");
ptbr.setLingo("_REDPGTITLE_", "RedPG");
ptbr.setLingo("_REDPGEXP1_", "RedPG é um sistema para facilitar RPGs de Mesa através da internet. Funções do sistema incluem o compartilhamento de Imagens, Sons, Fichas de Personagens, uma sala para troca de mensagens com suporte a dados e muito mais, com novas funções sempre sendo adicionadas.");
ptbr.setLingo("_REDPGEXP2_", "Todos os aspectos do sistema existem e estão presos às Mesas, que ele enxerga como um grupo de RPG. Então para criar qualquer coisa ou utilizar o sistema de qualquer maneira, você precisa criar ou ser convidado a uma Mesa. Isso é feito na seção \"Mesas\", no menu à esquerda.");
ptbr.setLingo("_REDPGFORUMTITLE_", "Últimos posts no Fórum");
// TODO: Implementar mensagens do fórum.
ptbr.setLingo("_REDPGFORUM1_", "Não Implementado");
ptbr.setLingo("_REDPGDONATIONTITLE_", "Doações");
ptbr.setLingo("_REDPGDONATIONEXP1_", "RedPG é um sistema gratuito e permanecerá gratuito enquanto isso for possível. Mas o servidor possui um custo e alguém precisa pagar.");
ptbr.setLingo("_REDPGDONATIONEXP2_", "Através de doações, você funda o desenvolvimento do sistema e ajuda a pagar as mensalidades do servidor. Com a ajuda de todos, RedPG poderá ser grátis para sempre!");
ptbr.setLingo("_REDPGDONATIONEXP3_", "Sempre que fizer uma doação, tente realizar ela a partir de uma conta registrada no mesmo nome registrado no RedPG. Assim, no futuro suas doações poderão ser contabilizadas pelo sistema do RedPG!");
ptbr.setLingo("_REDPGLINKSTITLE_", "Links úteis");
ptbr.setLingo("_REDPGLINKFRONTBUTTON_", "RedPG Front on GitHub");
ptbr.setLingo("_REDPGLINKFRONTEXP_", "Versão offline do cliente RedPG. Usuários que queiram abrir o RedPG a partir da própria máquina devem baixar versões atualizadas aqui. A versão offline permite que jogadores e mestres compartilhem sons que estejam dentro da pasta Sons, sem a necessidade de um servidor para compartilhar sons.");

// Menu
ptbr.setLingo("_MENULOGOUT_", "Logout");
ptbr.setLingo("_MENUGAMES_", "Mesas");
ptbr.setLingo("_MENUCONFIG_", "Opções");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");


// Jogos
ptbr.setLingo("_GAMESTITLE_", "Mesas");
ptbr.setLingo("_GAMESEXP1_", "Caso precise informar seu identificador para alguém, ele é \"%a\", sem as aspas.");
ptbr.setLingo("_GAMESEXP2_", "Aqui você pode administrar as mesas das quais você participa. Para convidar jogadores à sua mesa, você irá precisar do identificador deles.");
ptbr.setLingo("_GAMESEXP3_", "Uma mesa nesse sistema é o lugar no qual todas as outras partes do sistema se conectam. As salas, o ambiente no qual as partidas são jogadas, ficam anexadas à uma mesa. As fichas de personagens ficam anexadas à uma mesa.");
ptbr.setLingo("_GAMESEXP4_", "No momento não é possível pedir uma lista de mesas de livre entrada (não implementados).");
ptbr.setLingo("_GAMESINVITES_", "Meus convites");
ptbr.setLingo("_GAMESNEWGAME_", "Criar novo jogo");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");

// Chat
ptbr.setLingo("_CHATHELP01_", "Use \"/comandos\" para imprimir uma lista completa de comandos. Comandos básicos:");
ptbr.setLingo("_CHATHELP02_", "\"/me [mensagem]\": Envia a mensagem como uma ação da persona escolhida.");
ptbr.setLingo("_CHATHELP03_", "\"/off [mensagem]\": Envia a mensagem como uma mensagem fora de jogo, falando como o jogador.");
ptbr.setLingo("_CHATHELP04_", "\"/story [mensagem]\": Envia a mensagem como uma mensagem de história, disponível apenas para narradores.");
ptbr.setLingo("_CHATHELP05_", "Alternativamente, segure Alt, Control ou Shift quando for enviar a mensagem.");
ptbr.setLingo("_CHATHELP06_", "É recomendável executar \"/clear 1\" para limpar as mensagens no servidor de vez em quando, ou a sala ficará cada vez mais lenta.");
ptbr.setLingo("_CHATHELP07_", "Caso deseje usar as músicas em modo offline, mas o RedPG em modo online, clique no formulário abaixo e escolha suas músicas: você estará dando permissão temporária para o RedPG acessá-las.");
ptbr.setLingo("_CHATEMPTYNOTALLOWED_", "Mensagens vazias não são permitidas. Para limpar a tela de mensagens, digite \"/clear\".");
ptbr.setLingo("_CHATMESSAGENOTSENT_", "Houve um erro no envio da mensagem acima.");
ptbr.setLingo("_CHATMESSAGENOTSENTRESEND_", "Clique aqui para tentar novamente.");
ptbr.setLingo("_CHATHASCONNECTED_", "entrou na sala.");
ptbr.setLingo("_CHATHASDISCONNECTED_", "saiu da sala.");
ptbr.setLingo("_CHATOLDMESSAGESNOTLOADED_", "Mensagens antigas não foram impressas.");
ptbr.setLingo("_CHATOLDMESSAGESLOAD_", "Clique aqui para carregar todas as mensagens dessa sala.");
ptbr.setLingo("_CHATYOUAREDISCONNECTED_", "Você foi desconectado.");
ptbr.setLingo("_CHATDISCONNECTEDRECONNECT_", "Clique aqui para reconectar.");
ptbr.setLingo("_CHATNOTALLMESSAGES_", "Algumas mensagens não foram impressas por estarem acima do limite atual de mensagens. Você pode aumentar o limite de mensagens em Opções.");
ptbr.setLingo("_CHATRECONNECTINGEXP_", "Você foi desconectado. Tentando reconectar...");
ptbr.setLingo("_CHATDISCONNECTEDEXP_", "Você está desconectado.");
ptbr.setLingo("_CHATMESSAGEROLEPLAYTRANSLATION_", "Tradução");
ptbr.setLingo("_CHATMESSAGEUNKNOWNTYPE_", "Mensagem de tipo desconhecido \"%a\", enviada por %b.");
ptbr.setLingo("_CHATSENDER_", "Jogador");
ptbr.setLingo("_CHATSENDERSTORYTELLER_", "Mestre");
ptbr.setLingo("_CHATDICEROLLED_", "rolou");
ptbr.setLingo("_CHATDICESECRETROLLED_", "secretamente rolou");
ptbr.setLingo("_CHATDICESHOWN_", "mostrou");
ptbr.setLingo("_CHATDICESECRETSHOWN_", "secretamente mostrou");
ptbr.setLingo("_CHATMESSAGEDICEREASON_", "Motivo");
ptbr.setLingo("_CHATMESSAGEWHISPERTO_", "Mensagem enviada para");
ptbr.setLingo("_CHATMESSAGEWHISPERFROM_", "Mensagem recebida de");
ptbr.setLingo("_CHATMESSAGESHAREDBGM_", "compartilhou um som");
ptbr.setLingo("_CHATMESSAGEPLAYBGM_", "Tocar");
ptbr.setLingo("_CHATMESSAGESHAREDIMAGE_", "compartilhou uma imagem");
ptbr.setLingo("_CHATMESSAGESEEIMAGE_", "Ver");
ptbr.setLingo("_CHATMESSAGESHAREDSE_", "compartilhou um efeito sonoro");
ptbr.setLingo("_CHATMESSAGEPLAYSE_", "Ouvir");
ptbr.setLingo("_CHATMESSAGESHAREDVIDEO_", "compartilhou um video");
ptbr.setLingo("_CHATMESSAGEPLAYVIDEO_", "Assistir");
ptbr.setLingo("_CHATMESSAGEVOTECREATEDVOTE_", "criou uma votação");
ptbr.setLingo("_CHATDICEROLLEDWAITING_", "Esperando resposta do servidor...");
ptbr.setLingo("_CHATDICEAMOUNT_", "#");
ptbr.setLingo("_CHATDICEFACES_", "d#");
ptbr.setLingo("_CHATDICEMOD_", "mod");
ptbr.setLingo("_CHATDICEREASON_", "Razão");
ptbr.setLingo("_CHATWHISPERNOTARGETSFOUND_", "Nenhum jogador encontrado para \"%a\".");
ptbr.setLingo("_CHATMULTIPLETARGETSFOUND_", "Múltiplos jogadores encontrados");
ptbr.setLingo("_CHATINVALIDCOMMAND_", "Comando inválido. Digite \"/comandos\" para imprimir uma lista completa de comandos.");
ptbr.setLingo("_CHATBGMERROR_", "Erro ao tocar música.");
ptbr.setLingo("_CHATSEERROR_", "Erro ao tocar efeito sonoro.");
ptbr.setLingo("_CHATSOUNDADDMORE_", "Clique aqui para alterar músicas em uso.");
ptbr.setLingo("_CHATMESSAGEANNOUNCEMENT_", "AVISO DO SISTEMA");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");

// Chat Persona Designer
ptbr.setLingo("_PERSONADESIGNERTITLE_", "Administrador de Personas");
ptbr.setLingo("_PERSONADESIGNERNAME_", "Nome do Personagem");
ptbr.setLingo("_PERSONADESIGNERAVATAR_", "Link para Imagem (Opcional)");
ptbr.setLingo("_PERSONADESIGNERCREATE_", "Criar");
ptbr.setLingo("_CHATPERSONADESIGNERUSE_", "Usar essa persona");
ptbr.setLingo("_CHATPERSONADESIGNERDELETE_", "Deletar essa persona");
ptbr.setLingo("", "");
ptbr.setLingo("", "");


// Config
ptbr.setLingo("_CONFIGTITLE_", "Configurações");
ptbr.setLingo("_CONFIGCHATFONTSIZE_", "(Chat) Tamanho da fonte:");
ptbr.setLingo("_CONFIGCHATFONTFAMILY_", "(Chat) Fonte:");
ptbr.setLingo("_CHATFONTSIZEEXP01_", "Define o tamanho da fonte utilizada no chat.");
ptbr.setLingo("_CHATFONTSIZEEXP02_", "A fonte se torna menor para a esquerda e maior para a direita.");
ptbr.setLingo("_CHATFONTFAMILEXP01_", "Define qual é a fonte utilizada no Chat. Você pode utilizar qualquer fonte disponível no seu computador.");
ptbr.setLingo("_CHATFONTFAMILEXP02_", "A fonte usada no RedPG é \"Alegreya\". A fonte utilizada no antigo chat do RedPG é \"Caudex\" e ainda está disponível.");
ptbr.setLingo("_CONFIGCHATHELP_", "(Chat) Mostrar texto de ajuda:");
ptbr.setLingo("_CONFIGCHATHELPEXP_", "O texto de ajuda é o guia rápido de utilização do Chat que é normalmente impresso no topo da sala. Essa opção pode esconder esse texto.");
ptbr.setLingo("_CONFIGCHATHELPOP01_", "Imprimir mensagens de ajuda");
ptbr.setLingo("_CONFIGCHATHELPOP02_", "Não imprimir mensagens de ajuda");
ptbr.setLingo("_CONFIGANIMATIONTIME_", "Duração de animações:");
ptbr.setLingo("_ANIMATIONTIMEEXP01_", "Todas as animações do RedPG serão proporcionais a essa configuração.");
ptbr.setLingo("_ANIMATIONTIMEEXP02_", "Abaixar essa configuração pode ajudar em dispositivos mais lentos que estejam tendo dificuldades em processar as animações do RedPG.");
ptbr.setLingo("_CONFIGCHATAUTOEXP_", "Quando recebendo compartilhamentos no Chat, essa opção define quando o compartilhamento é aceito automaticamente. Você sempre pode aceitar manualmente.");
ptbr.setLingo("_CONFIGCHATAUTONEVER_", "Nunca");
ptbr.setLingo("_CONFIGCHATAUTOSOMETIMES_", "Apenas quando enviado pelo narrador");
ptbr.setLingo("_CONFIGCHATAUTOALWAYS_", "Sempre");
ptbr.setLingo("_CONFIGCHATAUTOBGM_", "(Chat) Aceitar músicas:");
ptbr.setLingo("_CONFIGCHATAUTOSE_", "(Chat) Aceitar efeitos sonoros:");
ptbr.setLingo("_CONFIGCHATAUTOIMAGE_", "(Chat) Aceitar imagens:");
ptbr.setLingo("_CONFIGCHATAUTOVIDEO_", "(Chat) Aceitar vídeos:");
ptbr.setLingo("_CONFIGCHATMAXMESSAGESEXP01_", "Define quantas mensagens podem estar impressas no chat ao mesmo tempo. Mínimo de 60 mensagens e máximo de 10000 mensagens. Escolha de acordo com seu CPU.");
ptbr.setLingo("_CONFIGCHATMAXMESSAGESEXP02_", "Essa opção é ignorada e se torna 60 quando utilizando dispositivos móveis.");
ptbr.setLingo("_CONFIGCHATMAXMESSAGES_", "(Chat) Número de mensagens:");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");
ptbr.setLingo("", "");

// Lingolist
LingoList.storeLingo(ptbr);
delete (ptbr);