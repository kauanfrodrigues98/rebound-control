<template>
  <section class="requests-page">
    <article class="panel">
      <div class="panel-heading">
        <div>
          <span>Comercial</span>
          <h2>Solicitações self-hosted</h2>
          <p>
            Acompanhe o interesse dos clientes Cloud e entre em contato para
            negociar a implantação.
          </p>
        </div>
        <button class="ghost-button" :disabled="pending" @click="refresh()">
          Atualizar
        </button>
      </div>
      <div class="request-toolbar">
        <label
          >Status<select v-model="status">
            <option value="">Todos</option>
            <option v-for="(label, key) in statuses" :key="key" :value="key">
              {{ label }}
            </option>
          </select></label
        ><span class="muted-text">{{ data?.total ?? 0 }} solicitações</span>
      </div>
      <p v-if="!data?.emailConfigured" class="status-banner">
        Aviso por e-mail aguardando configuração de SMTP e destinatário. As
        solicitações permanecem registradas.
      </p>

      <p v-if="pending" class="empty-state">Carregando solicitações...</p>
      <div v-else-if="!data?.requests.length" class="empty-state">
        Nenhuma solicitação encontrada.
      </div>
      <div v-else class="requests-list">
        <article
          v-for="item in data.requests"
          :key="item.id"
          class="request-card"
        >
          <div class="request-card-heading">
            <div>
              <NuxtLink
                :to="`/customers/${item.customer_id}`"
                class="request-customer"
                >{{ item.customer_name }}</NuxtLink
              >
              <p class="muted-text">
                {{ dateTime(item.created_at) }} · {{ item.id }}
              </p>
            </div>
            <span class="badge neutral">{{ statuses[item.status] }}</span>
          </div>
          <div class="request-contact">
            <strong>{{ item.contact_name }}</strong
            ><a :href="`mailto:${item.contact_email}`">{{
              item.contact_email
            }}</a
            ><span v-if="item.contact_phone">{{ item.contact_phone }}</span>
          </div>
          <p class="request-message">{{ item.message }}</p>
          <div class="request-email">
            <span class="muted-text"
              >Aviso por e-mail: {{ emailStatuses[item.email_state] }}</span
            ><button
              v-if="item.email_state === 'failed' && user?.role === 'admin'"
              class="ghost-button"
              :disabled="busy"
              @click="retry(item.id)"
            >
              Tentar envio novamente
            </button>
          </div>
          <p v-if="item.last_note" class="muted-text">
            Última observação: {{ item.last_note }}
          </p>
          <form
            v-if="
              ['new', 'in_progress'].includes(item.status) &&
              user?.role === 'admin'
            "
            class="request-action"
            @submit.prevent="update(item.id)"
          >
            <label
              >Próximo status<select v-model="draft(item.id).status">
                <option value="in_progress">Em atendimento</option>
                <option value="completed">Concluída</option>
                <option value="closed">Encerrada sem contratação</option>
              </select></label
            >
            <label
              >Observação<textarea
                v-model.trim="draft(item.id).note"
                required
                minlength="3"
                maxlength="1000"
                rows="2"
                placeholder="Registre o contato ou resultado da negociação."
              />
            </label>
            <button
              class="primary-action-button"
              type="submit"
              :disabled="busy"
            >
              Salvar acompanhamento
            </button>
          </form>
        </article>
      </div>
      <div class="request-pagination">
        <button
          class="ghost-button"
          :disabled="page <= 1 || pending"
          @click="page--"
        >
          Anterior</button
        ><span>Página {{ page }}</span
        ><button
          class="ghost-button"
          :disabled="page * 20 >= (data?.total ?? 0) || pending"
          @click="page++"
        >
          Próxima
        </button>
      </div>
    </article>
  </section>
</template>
<script setup lang="ts">
const toast = useToast();
definePageMeta({ title: "Solicitações", eyebrow: "Comercial" });
interface SalesRequest {
  id: string;
  customer_id: string;
  customer_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  message: string;
  status: string;
  email_state: string;
  created_at: string;
  last_note: string | null;
}
const { user } = useControlAuth();
const statuses: Record<string, string> = {
  new: "Nova",
  in_progress: "Em atendimento",
  completed: "Concluída",
  closed: "Encerrada sem contratação",
};
const emailStatuses: Record<string, string> = {
  pending: "Aguardando envio",
  sending: "Enviando",
  sent: "Enviado",
  failed: "Falha no envio",
};
const status = ref(""),
  page = ref(1),
  busy = ref(false),
  actionError = ref("");
watch(status, () => {
  page.value = 1;
});
const { data, pending, error, refresh } = await useFetch<{
  requests: SalesRequest[];
  total: number;
  emailConfigured: boolean;
}>("/api/requests", { query: { status, page } });
const drafts = reactive<Record<string, { status: string; note: string }>>({});
function draft(id: string) {
  return drafts[id] ?? (drafts[id] = { status: "in_progress", note: "" });
}
function dateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
async function update(id: string) {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    await $fetch(`/api/requests/${id}`, { method: "PUT", body: draft(id) });
    await refresh();
    toast.add({ title: "Solicitação atualizada", color: "success" });
  } catch {
    actionError.value =
      "Não foi possível atualizar. Recarregue e confira o status antes de repetir.";
  } finally {
    busy.value = false;
  }
}
async function retry(id: string) {
  if (busy.value) return;
  busy.value = true;
  actionError.value = "";
  try {
    await $fetch(`/api/requests/${id}/retry-email`, { method: "POST" });
    await refresh();
  } catch {
    actionError.value = "Não foi possível solicitar novo envio.";
  } finally {
    busy.value = false;
  }
}
useFeedbackToast(actionError, 'error');
useFeedbackToast(() => error.value ? 'Não foi possível carregar as solicitações.' : '');
</script>
<style scoped>
.requests-page {
  display: grid;
  gap: 24px;
  color: var(--text);
}
.panel {
  padding: 24px;
}
.panel-heading {
  padding: 0 0 20px;
}
.request-toolbar,
.request-pagination,
.request-card-heading,
.request-email {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.request-toolbar {
  padding: 18px 0;
}
.request-toolbar label,
.request-action label {
  display: grid;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted-strong);
}
.requests-list {
  display: grid;
  gap: 16px;
}
.request-card {
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
}
.request-customer {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
}
.request-contact {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin: 18px 0 10px;
}
.request-contact a {
  color: var(--blue);
}
.request-message {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.6;
}
.request-email {
  margin: 16px 0;
}
.request-action {
  display: grid;
  grid-template-columns: 200px 1fr auto;
  align-items: end;
  gap: 12px;
  border-top: 1px solid var(--border);
  padding-top: 16px;
}
.request-action button {
  align-self: end;
}
.request-pagination {
  margin-top: 20px;
}
select,
textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
}
@media (max-width: 850px) {
  .request-action {
    grid-template-columns: 1fr;
  }
  .request-card-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .request-toolbar {
    flex-wrap: wrap;
  }
  .panel {
    padding: 16px;
  }
}
</style>
