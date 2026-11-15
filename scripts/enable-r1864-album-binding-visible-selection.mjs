// R1864: mirror the *visible* active binding choice when storing/submitting
// a photographer album. The R1539 UI displays the first active binding if the
// historic default id is missing/archived; the raw state is not changed until
// a different <option> is selected, leaving validation and payload inconsistent.
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';

const asset='assets/index-UIRefine-v655-r84.js';
const helper=