# FIELDNOTE 개편 A단계 — 기준 검사 실패 감사

기준일: 2026-11-15 (Asia/Seoul). 감사 범위: 기존 두 검사 실패의 원인과 재현.

이 작업은 **제품·테스트 소스에 대한 읽기 전용 감사**다. 이 증거 문서만 추가했으며 제품 소스, 테스트, 라이브러리, 운영체제 설정, 배포를 수정하지 않았다. 기존 테스트가 임시 디렉터리의 fixture를 만들고 정리하는 동작은 수행했다.

## 기준 실행과 이번 재현의 구분

- 주 작업에서 `npm run build` 성공, `npm run check`의 152개 검사 중 150개 통과·2개 실패를 확인했다는 결과를 전달받았다. 전체 로그는 이 감사에서 새로 확보하지 않았다.
- 이번 감사에서는 해당 두 검사를 정확한 이름으로 다시 실행하여 **2개 모두 동일 원인으로 실패**함을 직접 확인했다. 종료 코드 1.
- 환경: Windows (`win32`), Node.js `v24.16.0`, 경로 구분자 `\\`.
- GitHub CI는 `.github/workflows/ci.yml`의 `ubuntu-latest` / Node 22이며 이번 Windows 실행과 환경이 다르다. 이번 감사에서 원격 CI를 실행하거나 Linux 통과를 새로 확인한 것은 아니다.

## 재현 명령

저장소 루트에서 실행:

```powershell
node --test --test-name-pattern='Pages composition rejects symlink assets and source aliases|built app contains only the allowed runtime and no archived editing/data entry points' tests/pages-preview.test.mjs tests/v2-integration-audit.test.mjs
```

결과:

```text
tests 2
pass 0
fail 2
exit code 1

tests/pages-preview.test.mjs:46
Error: EPERM: operation not permitted, symlink
  .../production/index.html -> .../work/assets/linked.html
  at tests/pages-preview.test.mjs:48:3

tests/v2-integration-audit.test.mjs:53
AssertionError [ERR_ASSERTION]: unexpected deploy file: assets\adex2025\k2pl-event-01.jpg
  at tests/v2-integration-audit.test.mjs:55:34
```

임시 경로의 사용자별 전체 문자열은 생략했으며 오류 코드·syscall·소스 위치는 그대로 기록했다.

## 실패 1 — 심볼릭 링크 fixture를 만들 수 없음

- `tests/pages-preview.test.mjs:48`에서 Node `fs/promises.symlink()`로 파일 링크를 만드는 단계가 `EPERM`으로 실패한다.
- 따라서 다음 줄의 `assemblePagesPreview()` 호출과 `Symlinks are not allowed` 검증에 도달하지 못했다. 앱 조립기가 링크를 허용했다는 실패가 아니다.
- `scripts/assemble-pages-preview.mjs`에는 경로 구성요소를 `lstat()`으로 점검하는 `rejectSymlinkPath()`와 트리의 심볼릭 링크를 거부하는 `inspectTree()`가 존재한다. 소스 확인은 실제 실행 통과를 대체하지 않는다.
- 현재 Windows 실행 환경에서 링크 생성이 허용되지 않은 사실까지 확인했다. Windows 권한과 샌드박스 정책 중 어느 제약이 단독 원인인지는 이 감사만으로 구분하지 않았다. 권한 상승·개발자 모드 변경은 수행하지 않았다.

## 실패 2 — 검사 경로의 Windows 구분자 처리 누락

- `tests/v2-integration-audit.test.mjs:54`는 `path.relative()` 결과를 그대로 사용한다. Windows에서는 `assets\\adex2025\\k2pl-event-01.jpg` 형태다.
- 55행 허용 정규식은 `assets/`, `src/v2/`, `data/v2/app/`처럼 `/`만 허용하므로 정상 허용 위치의 첫 자산에서도 실패한다.
- 동일 산출물 목록을 읽기만 하고 `path.sep`을 `/`로 정규화한 후 같은 허용 규칙으로 비교했다. **98개 파일, 허용 범위를 벗어난 경로 0개**였다.
- 이 보조 확인은 해당 allowlist 오류의 원인을 뒷받침한다. 원래 테스트 통과, 모든 파일 내용의 공개 적합성, 모든 이미지 로딩, 배포 성공을 뜻하지 않는다. 원래 검사는 실패 상태로 유지했다.

보조 확인 재현 명령:

```powershell
node -e "const fs=require('node:fs'),path=require('node:path');const dir='dist';const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);const rows=walk(dir).map(f=>path.relative(dir,f));const normalized=rows.map(f=>f.split(path.sep).join('/'));const bad=normalized.filter(f=>!['index.html','version.json','.nojekyll'].includes(f)&&!/^(?:src\/v2\/|data\/v2\/app\/|assets\/)/.test(f));console.log(JSON.stringify({platform:process.platform,node:process.version,pathSeparator:path.sep,files:rows.length,firstRaw:rows.find(f=>f.startsWith('assets')),firstNormalized:normalized.find(f=>f.startsWith('assets/')),unexpectedAfterNormalization:bad,lintScript:JSON.parse(fs.readFileSync('package.json','utf8')).scripts.lint??null},null,2))"
```

출력 요약: `files: 98`, `unexpectedAfterNormalization: []`, `lintScript: null`, 종료 코드 0.

## Lint와 검증 한계

- `package.json`에 `lint` 스크립트는 없다. `npm run lint`를 실행하거나 lint 통과로 보고하지 않았다.
- `check`는 Node 문법 검사, v2 데이터 컴파일/검증, `npm test`를 수행한다. 별도의 lint 실행과는 다르다.
- 최초 축약된 테스트 이름 필터는 실제 테스트명과 일치하지 않아 목표 검사 검증으로 인정하지 않았다. 위 정확한 이름 필터로 재실행한 실패 결과만 결론에 사용했다.
- 제품 수정은 하지 않았으며 위 두 실패에 대한 수정도 하지 않았다. 전체 검사 성공을 완료 조건으로 사용하는 작업은 아직 통과 처리할 수 없다.
- 실제 브라우저, 모바일 기기, 저장된 PDF, 이미지 권리·식별 확인은 이 감사 범위 밖이다.

## 다음 검증 제안

1. 승인된 구현 묶음에서 allowlist 검사의 경로를 플랫폼과 무관하게 정규화하고 전체 검사를 재실행한다.
2. 링크 fixture를 생성할 수 있는 기존 Linux CI 환경에서 링크 거부 검사를 실행한다. Windows에서 권한 때문에 실행할 수 없는 경우 이를 명시적으로 구분하고 보안 검사를 무조건 통과 처리하지 않는다.
3. UI 구현 검증, 자료 조사 완료, 공개 배포 완료와 이 테스트 이식성 문제를 별도 상태로 관리한다.
