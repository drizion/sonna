# Sistema de Playlists e Metadados - Music Downloader

## 🎵 Novas Funcionalidades Implementadas

### 1. **Sistema de Playlists**
Agora você pode organizar suas músicas em playlists personalizadas!

#### Recursos:
- ✅ Criar playlists com nome, descrição e cor personalizada
- ✅ Adicionar/remover músicas de playlists
- ✅ Editar informações de playlists existentes
- ✅ Marcar playlists como favoritas
- ✅ Visualizar "Todos os Downloads" ou filtrar por playlist específica
- ✅ Remover músicas de playlists (sem deletar do armazenamento)

#### Como usar:
1. Vá para a aba **Biblioteca**
2. No painel lateral esquerdo, clique em **"Nova Playlist"**
3. Escolha nome, descrição e cor
4. Para adicionar músicas, clique no ícone **+** ao lado de cada música
5. Selecione a playlist desejada no menu que aparece

---

### 2. **Editor de Metadados**
Edite metadados completos de cada música para melhor organização!

#### Campos Editáveis:
- **Básicos**: Título, Artista, Álbum, Ano
- **Técnicos**: BPM, Tonalidade (Key), Formato
- **Classificação**: Gênero, Gravadora/Label
- **Emocionais**: Mood/Clima, Nível de Energia (1-10)
- **Pessoais**: Avaliação (estrelas), Tags, Notas

#### Como usar:
1. Na lista de músicas, clique no ícone de **lápis** (✏️) ao lado da música
2. Preencha os campos desejados
3. Clique em **Salvar**

---

### 3. **Metadados Automáticos**
Algumas informações são capturadas automaticamente do SoundCloud:
- BPM (quando disponível)
- Gênero (quando disponível)
- Artwork/Capa

---

## 📊 Novos Campos no Banco de Dados

### Track (Música)
```typescript
{
  // Campos básicos existentes...
  
  // Novos campos editáveis:
  album?: string;
  year?: number;
  label?: string;
  energy?: number;        // 1-10
  mood?: string;
  notes?: string;
  rating?: number;        // 1-5 estrelas
  playCount?: number;
  lastPlayed?: Date;
}
```

### Playlist
```typescript
{
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  source: 'soundcloud' | 'local';
  sourceUrl?: string;
  artwork?: string;
  createdDate: Date;
  updatedDate: Date;
  syncDate?: Date;
  category?: string;
  tags?: string[];
  color?: string;         // Cor hex para organização visual
  isPrivate?: boolean;
  isFavorite?: boolean;
}
```

---

## 🎨 Organização Visual

### Cores de Playlists
Escolha entre 10 cores predefinidas:
- Roxo, Rosa, Laranja, Verde, Azul
- Vermelho, Turquesa, Laranja Escuro, Índigo, Lilás

### Views Disponíveis
- **Lista**: Visualização compacta com todas as informações
- **Grid Compacto**: Cards pequenos estilo biblioteca
- **Grid Expandido**: Cards grandes com mais detalhes e metadados

---

## 🔍 Filtros e Busca

### Por Playlist
- Clique em "Todos os Downloads" para ver todas as músicas
- Clique em uma playlist específica para filtrar

### Metadados Visíveis
Na visualização Grid, você verá:
- Duração
- BPM (se preenchido)
- Formato de áudio
- Tamanho do arquivo

---

## 💾 Armazenamento

### Banco de Dados IndexedDB
- Versão atualizada para v2
- Novos índices para melhor performance
- Suporte a migração automática de dados antigos

### Estrutura:
```
music-downloader-db
├── tracks (músicas com metadados)
├── playlists (suas playlists)
└── metadata (configurações e estatísticas)
```

---

## 🚀 Como Começar

1. **Baixe suas músicas** do SoundCloud na aba "Baixar"
2. **Crie playlists** na aba "Biblioteca" → Sidebar esquerdo
3. **Organize suas músicas** adicionando-as às playlists
4. **Edite metadados** clicando no ícone de lápis
5. **Filtre e navegue** entre playlists e a biblioteca completa

---

## 🎯 Dicas de Uso

### Para DJs:
- Use BPM e Key para organizar sets
- Classifique por Energia para criar transições
- Use Tags para momentos específicos (abertura, pico, encerramento)

### Para Colecionadores:
- Preencha Álbum e Ano para catalogação
- Use Gênero e Label para organização
- Avalie com estrelas suas favoritas

### Para Estudos/Trabalho:
- Crie playlists por Mood
- Use Energia para regular intensidade
- Organize por Tags de atividades

---

## 📝 Notas Técnicas

### Performance:
- Playlists são carregadas sob demanda
- Índices otimizados para buscas rápidas
- Lazy loading de metadados

### Compatibilidade:
- Funciona offline após primeiro carregamento
- Sincronização automática de mudanças
- Backup via exportação de dados

---

## 🐛 Troubleshooting

**Músicas não aparecem na playlist?**
- Verifique se você salvou a playlist após adicionar músicas
- Recarregue a página se necessário

**Metadados não salvam?**
- Certifique-se de preencher Título e Artista (obrigatórios)
- Clique em "Salvar" antes de fechar o modal

**Erro ao criar playlist?**
- Nome é obrigatório
- Tente um nome diferente se houver conflito

---

Desenvolvido com ❤️ para organizar sua biblioteca musical!
