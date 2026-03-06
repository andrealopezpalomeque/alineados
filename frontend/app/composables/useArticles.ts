import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  type QueryConstraint,
  type DocumentSnapshot,
  Timestamp,
} from 'firebase/firestore'
import type { Article, ArticleCategory } from '~/types/article'

export interface ArticleFilters {
  category?: ArticleCategory
  source?: string
  urgency?: 'breaking' | 'important' | 'routine'
}

const PAGE_SIZE = 20

function toDate(val: unknown): Date {
  if (val instanceof Timestamp) return val.toDate()
  if (val instanceof Date) return val
  if (typeof val === 'string' || typeof val === 'number') return new Date(val)
  if (val && typeof val === 'object' && 'seconds' in val) {
    return new Date((val as { seconds: number }).seconds * 1000)
  }
  return new Date()
}

function docToArticle(docSnap: DocumentSnapshot): Article {
  const data = docSnap.data()!
  return {
    ...data,
    id: docSnap.id,
    publishedAt: toDate(data.publishedAt),
    scrapedAt: toDate(data.scrapedAt),
    processedAt: data.processedAt ? toDate(data.processedAt) : undefined,
  } as Article
}

export function useArticles(defaultFilters?: ArticleFilters) {
  const { $firestore } = useNuxtApp()

  const articles = ref<Article[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const filters = reactive<ArticleFilters>({ ...defaultFilters })

  let lastDoc: DocumentSnapshot | null = null

  function buildQuery(isLoadMore = false) {
    const constraints: QueryConstraint[] = [
      where('processed', '==', true),
      where('archived', '==', false),
      orderBy('publishedAt', 'desc'),
    ]

    if (filters.category) {
      constraints.push(where('category', '==', filters.category))
    }
    if (filters.source) {
      constraints.push(where('source', '==', filters.source))
    }
    if (filters.urgency) {
      constraints.push(where('urgency', '==', filters.urgency))
    }

    if (isLoadMore && lastDoc) {
      constraints.push(startAfter(lastDoc))
    }

    constraints.push(limit(PAGE_SIZE))

    return query(collection($firestore, 'articles'), ...constraints)
  }

  async function fetchArticles() {
    loading.value = true
    error.value = null
    lastDoc = null
    hasMore.value = true

    try {
      const q = buildQuery(false)
      const snapshot = await getDocs(q)

      articles.value = snapshot.docs.map(docToArticle)
      lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
      hasMore.value = snapshot.docs.length === PAGE_SIZE
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar noticias'
      console.error('Error fetching articles:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loading.value) return

    loading.value = true
    try {
      const q = buildQuery(true)
      const snapshot = await getDocs(q)

      const newArticles = snapshot.docs.map(docToArticle)
      articles.value.push(...newArticles)
      lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
      hasMore.value = snapshot.docs.length === PAGE_SIZE
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar más noticias'
      console.error('Error loading more articles:', e)
    } finally {
      loading.value = false
    }
  }

  function setFilter(key: keyof ArticleFilters, value: string | undefined) {
    ;(filters as Record<string, unknown>)[key] = value
    fetchArticles()
  }

  // Initial fetch on client
  if (import.meta.client) {
    fetchArticles()
  }

  return {
    articles: readonly(articles),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    filters,
    loadMore,
    setFilter,
    refresh: fetchArticles,
  }
}

export function useArticle(id: string) {
  const { $firestore } = useNuxtApp()

  const article = ref<Article | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchArticle() {
    loading.value = true
    error.value = null

    try {
      const docRef = doc($firestore, 'articles', id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        article.value = docToArticle(docSnap)
      } else {
        error.value = 'Artículo no encontrado'
      }
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Error al cargar el artículo'
      console.error('Error fetching article:', e)
    } finally {
      loading.value = false
    }
  }

  if (import.meta.client) {
    fetchArticle()
  }

  return {
    article: readonly(article),
    loading: readonly(loading),
    error: readonly(error),
    refresh: fetchArticle,
  }
}
