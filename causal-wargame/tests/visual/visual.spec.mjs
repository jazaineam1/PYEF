import { test, expect } from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import { installDeanMocks, PHASES, VARIANTS, VIEWPORTS, ROLE_VIEWPORTS, fixtureFor, prepareRole } from './fixtures.mjs'

async function measure(page) {
  return page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
    const root = document.documentElement
    const stage = document.querySelector('[data-dean-zone="stage"]')
    const stageScrollHeight = stage?.scrollHeight ?? null
    const stageClientHeight = stage?.clientHeight ?? null
    const stageOwnScrollAllowed = stage?.dataset.deanScroll === 'allowed'
    const stageOverflow = Boolean(stage && (stageScrollHeight > stageClientHeight + 1 || stageOwnScrollAllowed))
    const clipped = [...document.querySelectorAll('*')].filter((el) => visible(el) && el.dataset.deanScroll !== 'allowed' && el.scrollHeight > el.clientHeight + 1).slice(0, 30).map((el) => ({ tag: el.tagName, text: (el.textContent || '').trim().slice(0, 100), scrollHeight: el.scrollHeight, clientHeight: el.clientHeight }))
    const fonts = [...document.querySelectorAll('*')].filter(visible).map((el) => Number.parseFloat(getComputedStyle(el).fontSize)).filter(Number.isFinite)
    const cta = [...document.querySelectorAll('[data-dean-cta="primary"],button,.dean-big')].find(visible)
    const cr = cta?.getBoundingClientRect()
    return { overflowVertical: root.scrollHeight > innerHeight + 1, overflowHorizontal: root.scrollWidth > innerWidth + 1, scrollHeight: root.scrollHeight, scrollWidth: root.scrollWidth, innerHeight, innerWidth, stageOverflow, stageScrollHeight, stageClientHeight, stageOwnScrollAllowed, ctaVisible: Boolean(cta), ctaInViewport: Boolean(cr && cr.top >= 0 && cr.bottom <= innerHeight), clippedElements: clipped, minFontPx: fonts.length ? Math.min(...fonts) : null }
  })
}

for (const role of ['player', 'teacher', 'wall']) for (const phase of PHASES) for (const variant of VARIANTS) {
  for (const viewport of ROLE_VIEWPORTS[role]) {
    test(`${role} · ${phase} · ${variant} · ${viewport}`, async ({ page }, testInfo) => {
      await installDeanMocks(page)
      await page.setViewportSize(VIEWPORTS[viewport])
      await prepareRole(page, role, phase, variant)
      const metrics = await measure(page)
      const fixture = fixtureFor(role, phase, variant, viewport)
      if (testInfo.project.name === 'report') {
        const stem = `${role}-${phase}-${variant}`
        const dir = path.join('artifacts', 'visual', viewport)
        await fs.mkdir(dir, { recursive: true })
        await page.screenshot({ path: path.join(dir, `${stem}.png`), fullPage: false })
        await fs.writeFile(path.join(dir, `${stem}.metrics.json`), JSON.stringify({ ...fixture, ...metrics }, null, 2))
      } else {
        await test.step(`contrato de pantalla única · ${phase} · ${viewport}`, async () => {
          expect(metrics.overflowVertical, `overflow vertical en ${role}/${phase}/${viewport}`).toBe(false)
          expect(metrics.overflowHorizontal, `overflow horizontal en ${role}/${phase}/${viewport}`).toBe(false)
          if (!fixture.noAction) expect(metrics.ctaInViewport, `CTA fuera del viewport en ${role}/${phase}/${viewport}`).toBe(true)
          if (viewport.startsWith('desktop') || viewport === 'tablet') expect(metrics.stageOverflow, `stage con overflow en ${role}/${phase}/${viewport}`).toBe(false)
          expect(metrics.clippedElements, `elementos recortados en ${role}/${phase}/${viewport}`).toEqual([])
        })
      }
    })
  }
}
