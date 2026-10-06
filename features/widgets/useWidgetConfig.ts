import { useCallback, useEffect, useState } from 'react';
import type { z } from 'zod';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Widget } from '@/services/schemas';

// Typed, optimistic access to widget.config. save() returns an error message, or null on success.
export function useWidgetConfig<S extends z.ZodTypeAny>(widget: Widget, schema: S) {
  const [local, setLocal] = useState<unknown>(null);
  useEffect(() => { setLocal(null); }, [widget.config]);
  const parsed = schema.safeParse(local ?? widget.config);
  const config = (parsed.success ? parsed.data : schema.parse({})) as z.output<S>;
  const save = useCallback(async (patch: Partial<z.output<S>>) => {
    const next = { ...(config as object), ...(patch as object) } as Record<string, unknown>;
    setLocal(next);
    try { await api.widgets.setConfig({ widgetId: widget.id, config: next }); return null; }
    catch (e) { setLocal(null); return errorMessage(e); }
  }, [config, widget.id]);
  return { config, save };
}
