#define _CRT_SECURE_NO_WARNINGS

#include <ctype.h>
#include <direct.h>
#include <errno.h>
#include <inttypes.h>
#include <io.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <windows.h>

#define MAX_LINE 2048
#define MAX_PATH_ARG 1024
#define HISTORY_SIZE 100

static char command_history[HISTORY_SIZE][MAX_LINE];
static int history_count = 0;

static void add_history_entry(const char *line) {
    int slot;

    if (line == NULL || *line == '\0') {
        return;
    }

    if (history_count < HISTORY_SIZE) {
        slot = history_count;
        history_count++;
    } else {
        int index;
        for (index = 1; index < HISTORY_SIZE; index++) {
            strcpy(command_history[index - 1], command_history[index]);
        }
        slot = HISTORY_SIZE - 1;
    }

    strncpy(command_history[slot], line, MAX_LINE - 1);
    command_history[slot][MAX_LINE - 1] = '\0';
}

static void print_history(void) {
    int index;

    for (index = 0; index < history_count; index++) {
        printf("%4d  %s\n", index + 1, command_history[index]);
    }
}

static bool contains_shell_operators(const char *text) {
    bool in_single_quotes = false;
    bool in_double_quotes = false;

    while (*text != '\0') {
        if (*text == '"' && !in_single_quotes) {
            in_double_quotes = !in_double_quotes;
        } else if (*text == '\'' && !in_double_quotes) {
            in_single_quotes = !in_single_quotes;
        } else if (!in_single_quotes && !in_double_quotes) {
            if (*text == '|' || *text == '<' || *text == '>') {
                return true;
            }
        }
        text++;
    }

    return false;
}

static int print_windows_error(const char *action, const char *target) {
    DWORD error = GetLastError();
    LPSTR message = NULL;

    FormatMessageA(
        FORMAT_MESSAGE_ALLOCATE_BUFFER | FORMAT_MESSAGE_FROM_SYSTEM |
            FORMAT_MESSAGE_IGNORE_INSERTS,
        NULL,
        error,
        MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
        (LPSTR)&message,
        0,
        NULL
    );

    if (message != NULL) {
        fprintf(stderr, "%s '%s': %s", action, target, message);
        LocalFree(message);
    } else {
        fprintf(stderr, "%s '%s' failed with Windows error %lu\n", action, target, error);
    }

    return 1;
}

static char *trim_whitespace(char *text) {
    char *start = text;
    char *end;

    while (*start != '\0' && isspace((unsigned char)*start)) {
        start++;
    }

    if (*start == '\0') {
        return start;
    }

    end = start + strlen(start) - 1;
    while (end > start && isspace((unsigned char)*end)) {
        *end = '\0';
        end--;
    }

    return start;
}

static void strip_matching_quotes(char *text) {
    size_t length = strlen(text);

    if (length >= 2) {
        if ((text[0] == '"' && text[length - 1] == '"') ||
            (text[0] == '\'' && text[length - 1] == '\'')) {
            memmove(text, text + 1, length - 2);
            text[length - 2] = '\0';
        }
    }
}

static void print_prompt(void) {
    char cwd[MAX_PATH];

    if (_getcwd(cwd, sizeof(cwd)) != NULL) {
        printf("myshell:%s$ ", cwd);
    } else {
        printf("myshell$ ");
    }
}

static void print_help(void) {
    puts("Mini Shell commands:");
    puts("  help                 Show this help message");
    puts("  exit, quit           Close the shell");
    puts("  cd <path>            Change directory");
    puts("  pwd                  Print current directory");
    puts("  history              Show recent commands");
    puts("  ls [path]            List files");
    puts("  cat <file...>        Print file contents");
    puts("  mkdir <dir>          Create a directory");
    puts("  rmdir <dir>          Remove an empty directory");
    puts("  rm <file>            Remove a file");
    puts("  cp <src> <dest>      Copy a file");
    puts("  mv <src> <dest>      Move or rename a file");
    puts("  touch <file>         Create an empty file if missing");
    puts("  clear                Clear the screen");
    puts("  Pipes and redirection use cmd.exe /C");
    puts("  Other commands run through cmd.exe /C");
}

static int builtin_cd(char *args) {
    char path[MAX_LINE];
    char *target = NULL;

    if (args != NULL) {
        args = trim_whitespace(args);
        if (*args != '\0') {
            strncpy(path, args, sizeof(path) - 1);
            path[sizeof(path) - 1] = '\0';
            strip_matching_quotes(path);
            target = path;
        }
    }

    if (target == NULL) {
        char *home = getenv("USERPROFILE");
        if (home == NULL || *home == '\0') {
            fprintf(stderr, "cd: USERPROFILE is not set.\n");
            return 1;
        }
        target = home;
    }

    if (_chdir(target) != 0) {
        fprintf(stderr, "cd: unable to change directory to '%s'\n", target);
        return 1;
    }

    return 0;
}

static int builtin_pwd(void) {
    char cwd[MAX_PATH];

    if (_getcwd(cwd, sizeof(cwd)) == NULL) {
        fputs("pwd: unable to read current directory\n", stderr);
        return 1;
    }

    puts(cwd);
    return 0;
}

static int read_single_path(char *args, char *output, size_t output_size) {
    char *trimmed;

    if (args == NULL) {
        fprintf(stderr, "missing path argument\n");
        return 1;
    }

    trimmed = trim_whitespace(args);
    if (*trimmed == '\0') {
        fprintf(stderr, "missing path argument\n");
        return 1;
    }

    strncpy(output, trimmed, output_size - 1);
    output[output_size - 1] = '\0';
    strip_matching_quotes(output);
    return 0;
}

static int read_two_paths(
    char *args,
    char *first,
    size_t first_size,
    char *second,
    size_t second_size
) {
    char buffer[MAX_LINE];
    char *left;
    char *right;

    if (args == NULL) {
        fprintf(stderr, "expected source and destination paths\n");
        return 1;
    }

    strncpy(buffer, args, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';

    left = trim_whitespace(buffer);
    right = left;
    while (*right != '\0' && !isspace((unsigned char)*right)) {
        right++;
    }

    if (*right == '\0') {
        fprintf(stderr, "expected source and destination paths\n");
        return 1;
    }

    *right = '\0';
    right++;
    right = trim_whitespace(right);

    if (*right == '\0') {
        fprintf(stderr, "expected source and destination paths\n");
        return 1;
    }

    strncpy(first, left, first_size - 1);
    first[first_size - 1] = '\0';
    strip_matching_quotes(first);

    strncpy(second, right, second_size - 1);
    second[second_size - 1] = '\0';
    strip_matching_quotes(second);

    return 0;
}

static int builtin_ls(char *args) {
    WIN32_FIND_DATAA entry;
    HANDLE handle;
    char path[MAX_PATH_ARG];
    char pattern[MAX_PATH_ARG + 5];
    bool show_all = false;
    bool long_format = false;

    if (args == NULL || *trim_whitespace(args) == '\0') {
        strcpy(path, ".");
    } else {
        char raw[MAX_PATH_ARG];
        char *cursor;

        if (read_single_path(args, raw, sizeof(raw)) != 0) {
            return 1;
        }

        if (strcmp(raw, "-a") == 0) {
            show_all = true;
            strcpy(path, ".");
        } else if (strcmp(raw, "-l") == 0) {
            long_format = true;
            strcpy(path, ".");
        } else {
            strncpy(path, raw, sizeof(path) - 1);
            path[sizeof(path) - 1] = '\0';
            cursor = trim_whitespace(path);
            memmove(path, cursor, strlen(cursor) + 1);
        }
    }

    _snprintf(pattern, sizeof(pattern), "%s\\*", path);
    handle = FindFirstFileA(pattern, &entry);
    if (handle == INVALID_HANDLE_VALUE) {
        return print_windows_error("ls", path);
    }

    do {
        bool hidden = (entry.dwFileAttributes & FILE_ATTRIBUTE_HIDDEN) != 0;
        bool is_dot = strcmp(entry.cFileName, ".") == 0 || strcmp(entry.cFileName, "..") == 0;
        bool is_dir = (entry.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) != 0;

        if ((hidden || is_dot) && !show_all) {
            continue;
        }

        if (long_format) {
            LARGE_INTEGER size;
            size.HighPart = entry.nFileSizeHigh;
            size.LowPart = entry.nFileSizeLow;
            printf(
                "%c %10" PRIu64 " %s\n",
                is_dir ? 'd' : '-',
                (uint64_t)size.QuadPart,
                entry.cFileName
            );
        } else {
            printf("%s%s\n", entry.cFileName, is_dir ? "/" : "");
        }
    } while (FindNextFileA(handle, &entry));

    FindClose(handle);
    return 0;
}

static int builtin_cat(char *args) {
    char buffer[MAX_LINE];
    char *token;
    FILE *file;
    int ch;
    bool printed_any = false;

    if (args == NULL || *trim_whitespace(args) == '\0') {
        fprintf(stderr, "cat: missing file operand\n");
        return 1;
    }

    strncpy(buffer, args, sizeof(buffer) - 1);
    buffer[sizeof(buffer) - 1] = '\0';
    token = strtok(buffer, " \t\r\n");

    while (token != NULL) {
        strip_matching_quotes(token);
        file = fopen(token, "r");
        if (file == NULL) {
            fprintf(stderr, "cat: cannot open '%s'\n", token);
            return 1;
        }

        while ((ch = fgetc(file)) != EOF) {
            putchar(ch);
        }

        fclose(file);
        printed_any = true;
        token = strtok(NULL, " \t\r\n");
    }

    if (printed_any) {
        fflush(stdout);
    }

    return 0;
}

static int builtin_mkdir(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "mkdir: missing directory operand\n");
        return 1;
    }

    if (_mkdir(path) != 0) {
        fprintf(stderr, "mkdir: cannot create '%s' (%s)\n", path, strerror(errno));
        return 1;
    }

    return 0;
}

static int builtin_rmdir(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "rmdir: missing directory operand\n");
        return 1;
    }

    if (_rmdir(path) != 0) {
        fprintf(stderr, "rmdir: cannot remove '%s' (%s)\n", path, strerror(errno));
        return 1;
    }

    return 0;
}

static int builtin_rm(char *args) {
    char path[MAX_PATH_ARG];

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "rm: missing file operand\n");
        return 1;
    }

    if (!DeleteFileA(path)) {
        return print_windows_error("rm", path);
    }

    return 0;
}

static int builtin_touch(char *args) {
    char path[MAX_PATH_ARG];
    FILE *file;

    if (read_single_path(args, path, sizeof(path)) != 0) {
        fprintf(stderr, "touch: missing file operand\n");
        return 1;
    }

    file = fopen(path, "ab");
    if (file == NULL) {
        fprintf(stderr, "touch: cannot open '%s'\n", path);
        return 1;
    }

    fclose(file);
    return 0;
}

static int builtin_cp(char *args) {
    char source[MAX_PATH_ARG];
    char destination[MAX_PATH_ARG];

    if (read_two_paths(args, source, sizeof(source), destination, sizeof(destination)) != 0) {
        fprintf(stderr, "cp: expected source and destination\n");
        return 1;
    }

    if (!CopyFileA(source, destination, FALSE)) {
        return print_windows_error("cp", source);
    }

    return 0;
}

static int builtin_mv(char *args) {
    char source[MAX_PATH_ARG];
    char destination[MAX_PATH_ARG];

    if (read_two_paths(args, source, sizeof(source), destination, sizeof(destination)) != 0) {
        fprintf(stderr, "mv: expected source and destination\n");
        return 1;
    }

    if (!MoveFileExA(source, destination, MOVEFILE_REPLACE_EXISTING)) {
        return print_windows_error("mv", source);
    }

    return 0;
}

static int builtin_clear(void) {
    HANDLE console = GetStdHandle(STD_OUTPUT_HANDLE);
    CONSOLE_SCREEN_BUFFER_INFO info;
    COORD origin = {0, 0};
    DWORD written;
    DWORD size;

    if (console == INVALID_HANDLE_VALUE || !GetConsoleScreenBufferInfo(console, &info)) {
        return 1;
    }

    size = (DWORD)(info.dwSize.X * info.dwSize.Y);
    FillConsoleOutputCharacterA(console, ' ', size, origin, &written);
    FillConsoleOutputAttribute(console, info.wAttributes, size, origin, &written);
    SetConsoleCursorPosition(console, origin);
    return 0;
}

static int run_external_command(const char *command_line) {
    STARTUPINFOA startup_info;
    PROCESS_INFORMATION process_info;
    char full_command[MAX_LINE + 32];
    DWORD exit_code = 1;
    BOOL created;

    memset(&startup_info, 0, sizeof(startup_info));
    memset(&process_info, 0, sizeof(process_info));
    startup_info.cb = sizeof(startup_info);

    _snprintf(
        full_command,
        sizeof(full_command),
        "cmd.exe /C %s",
        command_line
    );

    fflush(stdout);
    fflush(stderr);

    created = CreateProcessA(
        NULL,
        full_command,
        NULL,
        NULL,
        TRUE,
        0,
        NULL,
        NULL,
        &startup_info,
        &process_info
    );

    if (!created) {
        return print_windows_error("run", command_line);
    }

    WaitForSingleObject(process_info.hProcess, INFINITE);
    GetExitCodeProcess(process_info.hProcess, &exit_code);

    CloseHandle(process_info.hThread);
    CloseHandle(process_info.hProcess);

    return (int)exit_code;
}

static bool handle_command(char *line) {
    char *command;
    char *args;
    char full_line[MAX_LINE];

    command = trim_whitespace(line);
    if (*command == '\0') {
        return true;
    }

    strncpy(full_line, command, sizeof(full_line) - 1);
    full_line[sizeof(full_line) - 1] = '\0';
    add_history_entry(full_line);

    if (contains_shell_operators(full_line)) {
        run_external_command(full_line);
        return true;
    }

    args = command;
    while (*args != '\0' && !isspace((unsigned char)*args)) {
        args++;
    }

    if (*args != '\0') {
        *args = '\0';
        args++;
    } else {
        args = NULL;
    }

    if (_stricmp(command, "exit") == 0 || _stricmp(command, "quit") == 0) {
        return false;
    }

    if (_stricmp(command, "help") == 0) {
        print_help();
        return true;
    }

    if (_stricmp(command, "cd") == 0) {
        builtin_cd(args);
        return true;
    }

    if (_stricmp(command, "pwd") == 0) {
        builtin_pwd();
        return true;
    }

    if (_stricmp(command, "history") == 0) {
        print_history();
        return true;
    }

    if (_stricmp(command, "ls") == 0) {
        builtin_ls(args);
        return true;
    }

    if (_stricmp(command, "cat") == 0) {
        builtin_cat(args);
        return true;
    }

    if (_stricmp(command, "mkdir") == 0) {
        builtin_mkdir(args);
        return true;
    }

    if (_stricmp(command, "rmdir") == 0) {
        builtin_rmdir(args);
        return true;
    }

    if (_stricmp(command, "rm") == 0) {
        builtin_rm(args);
        return true;
    }

    if (_stricmp(command, "touch") == 0) {
        builtin_touch(args);
        return true;
    }

    if (_stricmp(command, "cp") == 0) {
        builtin_cp(args);
        return true;
    }

    if (_stricmp(command, "mv") == 0) {
        builtin_mv(args);
        return true;
    }

    if (_stricmp(command, "clear") == 0) {
        builtin_clear();
        return true;
    }

    run_external_command(full_line);
    return true;
}

int main(void) {
    char line[MAX_LINE];

    puts("Mini Windows Shell v2");
    puts("Linux-like built-ins are enabled. Type 'help' for commands.");

    while (true) {
        print_prompt();

        if (fgets(line, sizeof(line), stdin) == NULL) {
            putchar('\n');
            break;
        }

        if (!handle_command(line)) {
            break;
        }
    }

    return 0;
}
