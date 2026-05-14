list:
  @just --list

build-gh:
  ng build --base-href=/PDIGS/
deploy:
  ng deploy --base-href=/PDIGS/ --dir=dist/angular-app
